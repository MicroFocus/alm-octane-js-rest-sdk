/*
 * Copyright 2020-2023 Open Text.
 *
 * The only warranties for products and services of Open Text and
 * its affiliates and licensors (“Open Text”) are as may be set forth
 * in the express warranty statements accompanying such products and services.
 * Nothing herein should be construed as constituting an additional warranty.
 * Open Text shall not be liable for technical or editorial errors or
 * omissions contained herein. The information contained herein is subject
 * to change without notice.
 *
 * Except as specifically indicated otherwise, this document contains
 * confidential information and a valid license is required for possession,
 * use or copying. If this work is provided to the U.S. Government,
 * consistent with FAR 12.211 and 12.212, Commercial Computer Software,
 * Computer Software Documentation, and Technical Data for Commercial Items are
 * licensed to the U.S. Government under vendor's standard commercial license.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Params} from './octane';

import axios, {
    AxiosError,
    AxiosHeaders,
    AxiosInstance,
    AxiosProxyConfig,
    AxiosRequestConfig,
    AxiosRequestHeaders,
    AxiosResponse,
    ResponseType,
} from 'axios';
import {Cookie, CookieJar} from 'tough-cookie';
import log4js from 'log4js';
import {CookieAgent} from "http-cookie-agent/http";
import * as https from "node:https";
import * as http from "node:http";
import {HttpsProxyAgent} from "https-proxy-agent";
import {RawAxiosRequestHeaders} from "axios";

const Mutex = require('async-mutex').Mutex;

const logger = log4js.getLogger();
logger.level = 'debug';

/**
 * @class
 *
 * @param {Object} params - configurations to access Octane REST API
 * @param {String} params.server - server of Octane REST API URL (ex: https://myOctane:8080)
 * @param {Number} params.user - Octane user
 * @param {Number} params.password - Octane password
 * @param {String} [params.proxy] - if set, using proxy to connect to Octane
 * @param {Object} [params.headers] - JSON containing headers which will be used for all the requests
 */
class RequestHandler {
    private readonly _user: string;
    private readonly _password: string;
    private _mutex: typeof Mutex;
    private _cookieJar: CookieJar;
    private readonly _options: {
        httpsAgent?: CookieAgent<https.Agent>,
        httpAgent?: CookieAgent<http.Agent>,
        baseURL: string;
        responseType?: ResponseType;
        proxy?: AxiosProxyConfig;
        headers?: AxiosRequestHeaders;
    };
    private _requestor: AxiosInstance;
    private _needsAuthenication: boolean;

    constructor(params: Params) {
        this._user = params.user;
        this._password = params.password;
        this._needsAuthenication = false;
        this._cookieJar = new CookieJar();

        this._mutex = new Mutex();

        this._options = {
            baseURL: params.server,
            responseType: 'json',
        };

        if (params.proxy) {
            let httpAgent;
            if (params.proxyUsername && params.proxyPassword) {
                const proxyUrlWithCredentials = this.createProxyUrlWithCredentials(params.proxy, params.proxyUsername, params.proxyPassword)
                httpAgent = new HttpsProxyAgent(proxyUrlWithCredentials)
            } else {
                httpAgent = new HttpsProxyAgent(params.proxy)
            }
            this._options.httpAgent = httpAgent;
            this._options.httpsAgent = httpAgent;
        }

        if (params.headers) {
            this._options.headers = new AxiosHeaders(params.headers);
        }

        this._requestor = axios.create(this._options);
    }

    createProxyUrlWithCredentials(proxyUrl: string, username: string, password: string): string {
        const proxySplit = proxyUrl.split('://')
        const proxyProps: string[] = []
        proxyProps.push(proxySplit[0])
        proxyProps.push('://')
        proxyProps.push(`${username}:${password}@`)
        proxyProps.push(proxySplit[1])
        return proxyProps.join('')
    }

    /**
     * Fires a GET request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
     *
     * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
     * @param config - Extra configuration for the request (ex. headers)
     * @returns - The result of the operation returned by the server.
     * @throws - The error returned by the server if the request fails.
     */
    async get(url: string, config?: AxiosRequestConfig) {
        return await this.sendRequestWithCookies(url, async (headersWithCookie) =>
            this._requestor.get(url, {...config, headers: headersWithCookie}))
            .catch(async (err) => {
                await this._reauthenticate(err);
                return await this.sendRequestWithCookies(url, (headersWithCookie => this._requestor.get(url, {
                    ...config,
                    headers: headersWithCookie
                })));
            })
    }

    /**
     * Fires a DELETE request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
     *
     * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
     * @param config - Extra configuration for the request (ex. headers)
     * @returns - The result of the operation returned by the server.
     * @throws - The error returned by the server if the request fails.
     */
    async delete(url: string, config?: AxiosRequestConfig) {
        return await this.sendRequestWithCookies(url, async (headersWithCookie) =>
            this._requestor.delete(url, {...config, headers: headersWithCookie}))
            .catch(async (err) => {
                await this._reauthenticate(err);
                return this.sendRequestWithCookies(url, (headersWithCookie => this._requestor.delete(url, {
                    ...config,
                    headers: headersWithCookie
                })));
            })
    }

    /**
     * Fires a PUT request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
     *
     * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
     * @param body - A JSON which will be passed in the body of the request.
     * @param config - Extra configuration for the request (ex. headers)
     * @returns - The result of the operation returned by the server.
     * @throws - The error returned by the server if the request fails.
     */
    async update(url: string, body?: object | string, config?: AxiosRequestConfig) {
        return await this.sendRequestWithCookies(url, async (headersWithCookie) =>
            this._requestor.put(url, body,{...config, headers: headersWithCookie}))
            .catch(async (err) => {
                await this._reauthenticate(err);
                return this.sendRequestWithCookies(url, (headersWithCookie => this._requestor.put(url, body, {
                    ...config,
                    headers: headersWithCookie
                })));
            })
    }

    /**
     * Fires a POST request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
     *
     * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
     * @param body - A JSON which will be passed in the body of the request.
     * @param config - Extra configuration for the request (ex. headers)
     * @returns - The result of the operation returned by the server.
     * @throws - The error returned by the server if the request fails.
     */
    async create(url: string, body?: object | string, config?: AxiosRequestConfig) {
        return await this.sendRequestWithCookies(url, async (headersWithCookie) =>
            this._requestor.post(url, body, {...config, headers: headersWithCookie}))
            .catch(async (err) => {
                await this._reauthenticate(err);
                return this.sendRequestWithCookies(url, (headersWithCookie => this._requestor.post(url, body, {
                    ...config,
                    headers: headersWithCookie
                })));
            })

    }

    /**
     * A sign in request is fired.
     *
     * @throws - The error returned by the server if the request fails.
     */
    async authenticate() {
        const authOptions = {
            url: '/authentication/sign_in',
            body: {
                user: this._user,
                password: this._password,
            },
        };

        logger.debug('Signing in...');
        return await this.sendRequestWithCookies(authOptions.url, async (headersWithCookie) => {
            const request = await this._requestor.post(
                authOptions.url,
                authOptions.body,
                {
                    headers: headersWithCookie
                }
            );
            logger.debug('Signed in.');
            return request;
        });
    }

    /**
     * Fires a GET request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
     *
     * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
     * @param config - Extra configuration for the request (ex. headers)
     * @returns - The result of the operation returned by the server. The result is the content of the targeted attachment.
     * @throws - The error returned by the server if the request fails.
     */
    async getAttachmentContent(url: string, config?: AxiosRequestConfig) {
        const attachmentConfig: AxiosRequestConfig = {
            headers: {accept: 'application/octet-stream'},
            responseType: 'arraybuffer',
        };
        const configHeaders = config?.headers;
        const requestHeaders = {...configHeaders, ...attachmentConfig.headers}

        return await this.sendRequestWithCookies(url, async (headersWithCookie) =>
            this._requestor.get(url, {...config, ...attachmentConfig, headers: headersWithCookie}), requestHeaders)
            .catch(async (err) => {
                await this._reauthenticate(err);
                return this.sendRequestWithCookies(url, (headersWithCookie => this._requestor.get(url, {
                    ...config,
                    ...attachmentConfig,
                    headers: headersWithCookie
                })), requestHeaders);
            })
    }

    /**
     * Fires a POST request for the given URL. This request should upload the attachment to Octane. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
     *
     * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
     * @param body - An object which will be passed in the body of the request. This object should contain the content of the attachment.
     * @param config - Extra configuration for the request (ex. headers)
     * @returns - The result of the operation returned by the server.
     * @throws - The error returned by the server if the request fails.
     */

    async uploadAttachment(
        url: string,
        body: object | string,
        config?: AxiosRequestConfig
    ) {
        const attachmentConfig = {
            headers: {'content-type': 'application/octet-stream'},
        };

        const configHeaders = config === undefined ? undefined : config.headers;
        const requestHeaders = {...configHeaders, ...attachmentConfig.headers}

        return await this.sendRequestWithCookies(url, async (headersWithCookie) =>
            this._requestor.post(url, body, {...config, ...attachmentConfig, headers: headersWithCookie}), requestHeaders)
            .catch(async (err) => {
                await this._reauthenticate(err);
                return this.sendRequestWithCookies(url, (headersWithCookie => this._requestor.post(url, body, {
                    ...config,
                    ...attachmentConfig,
                    headers: headersWithCookie
                })), requestHeaders);
            })
    }

    /**
     * A sign-out request is fired.
     *
     * @throws - The error returned by the server if the request fails.
     */
    async signOut() {
        logger.debug('Signing out...');
        return this.sendRequestWithCookies('/authentication/sign_out', async (headersWithCookie) => {
            const request = await this._requestor.post('/authentication/sign_out', undefined, {headers: headersWithCookie});
            logger.debug('Signed out.');
            return request;
        })

    }

    /**
     * In case the previous request had a 401 (Unauthorized) status code, an authentication request must be fired.
     *
     * @param {Object} err - The error code of the previous error thrown at the failed request.
     * @throws - The error returned by the server if the request fails.
     * @private
     */
    private async _reauthenticate(
        err: AxiosError | { name?: string; response: { status?: number; data?: any } }
    ) {
        this._needsAuthenication = true;

        return this._mutex.runExclusive(async () => {
            if (err.response && err.response.status === 401) {
                if (!this._needsAuthenication) {
                    return;
                }
                logger.debug(
                    'The received error had status code 401. Trying to authenticate...'
                );
                const request = await this.authenticate();
                this._needsAuthenication = false;

                return request;
            } else {
                throw err;
            }
        });
    }

    async sendRequestWithCookies(url: string, callBack: (headersWithCookie?: RawAxiosRequestHeaders | AxiosHeaders) => Promise<AxiosResponse>, customHeaders?: RawAxiosRequestHeaders | AxiosHeaders): Promise<AxiosResponse> {
        const cookieHeader = await this.getCookieHeaderForUrl(url);
        const headersWithCookie = {...customHeaders, 'Cookie': cookieHeader};
        const response = await callBack(headersWithCookie);
        await this.updateCookieJarFromResponse(response, url);

        return response;
    }


    async updateCookieJarFromResponse(response: AxiosResponse, url: string) {
        const setCookieHeaders = response.headers['set-cookie'];
        if (setCookieHeaders) {
            for (const header of setCookieHeaders) {
                try {
                    // Parse the Set-Cookie header into a Cookie object
                    const cookie = Cookie.parse(header);
                    if (cookie) {
                        await new Promise<void>((resolve, reject) => {
                            this._cookieJar.setCookie(cookie, this._options.baseURL + url, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                } catch (error) {
                    console.error('Failed to parse or set cookie:', error);
                }
            }
        }
    }

    async getCookieHeaderForUrl(url: string): Promise<string> {
        return await this._cookieJar.getCookieString(this._options.baseURL + url);
    }
}

export default RequestHandler;
