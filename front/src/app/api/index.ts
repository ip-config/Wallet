// import { createPromise } from './ipc';

import { messages } from './error-messages';
import * as ipc from './ipc';
import {
    ISendTransactionResult,
    IAccountInfo,
    ICurrencyInfo,
    ISendTransactionParams,
    IResult,
    IValidation,
} from './types';

// FIXME remove
// import * as mock from './mock';

export * from './types';

const MAX_DELAY_DEFAULT = 10000;

let count = 0;
function nextRequestId(): string {
    return 'request' + count++;
}

function createPromise(
    type: string,
    payload?: any,
    maxDelay: number = MAX_DELAY_DEFAULT,
): Promise<IResult<any>> {
    return new Promise((done, reject) => {
        const requestId = nextRequestId();

        const callback = (event: any, response: IResult<any>) => {
            if (response.validation) {
                response.validation = processValidation(response.validation);
            }

            if (response.success) {
                done(response);
            } else {
                reject(response.error);
            }
        };

        ipc.once(requestId, callback);

        (ipc as any).send({
            requestId,
            type,
            payload,
        });
    });
}

function processValidation(obj: any): IValidation {
    return Object.keys(obj).reduce((acc: IValidation, key: string) => {
        acc[key] = messages[obj[key]];
        return acc;
    }, {});
}

export class Api {
    public static async setSecretKey(password: string): Promise<IResult<boolean>>  {
        return createPromise('account.setSecretKey', { password });
    }

    public static async addAccount(jsonRaw: string, password: string, name: string): Promise<IResult<IAccountInfo>> {
        return createPromise('account.add', { json: jsonRaw, password, name });
    }

    public static async removeAccount(address: string): Promise<IResult<boolean>> {
        return createPromise('account.remove', { address });
    }

    public static async renameAccount(address: string, name: string): Promise<IResult<boolean>> {
        return createPromise('account.rename', { address, name });
    }

    public static async getAccountList(): Promise<IResult<IAccountInfo[]>> {
        return createPromise('account.list');
    }

    public static async ping(): Promise<IResult<object>> {
        return createPromise('ping', {ping: true});
    }

    public static async getCurrencyList(): Promise<IResult<ICurrencyInfo[]>> {
        return createPromise('account.getCurrencies');
    }

    public static async send(tx: ISendTransactionParams)
    : Promise<IResult<ISendTransactionResult>> {
        return createPromise('account.send', tx);
    }

    // TODO rename to getTransactionList
    public static async getSendTransactionList(
        filters?: {
            currencyAddress?: string,
            toAddress?: string,
            fromAddress?: string,
            timeStart?: number,
            timeEnd?: number,
        },
        limit?: number,
        offset?: number,
    ): Promise<IResult<ISendTransactionResult[]>> {
        return createPromise('transaction.list', { filters, limit, offset});
    }

    public static async getGasPrice(): Promise<IResult<string>> {
        return createPromise('account.getGasPrice');
    }
}

export default Api;