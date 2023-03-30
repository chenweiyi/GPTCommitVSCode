/*
 * This code includes portions of code from the opencommit project, which is
 * licensed under the MIT License. Copyright (c) Dima Sukharev.
 * The original code can be found at https://github.com/di-sukharev/opencommit/blob/master/src/api.ts.
 */
import * as vscode from 'vscode';
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from 'openai';

import { generateCommitMessageChatCompletionPrompt } from './completion';
import { trimNewLines } from './text';
import axios from 'axios';

export const generateCommitMessage = async ({
    channel,
    apiKey,
    diff,
    delimeter,
    serviceUrl,
}: {
    channel: vscode.OutputChannel,
    apiKey?: string,
    diff: string,
    delimeter?: string,
    serviceUrl?: string
}) => {

    channel.appendLine(`[generateCommitMessage] params: ${apiKey} ${serviceUrl} ${delimeter}`);

    if (!apiKey && !serviceUrl) {
        throw new Error('Either apiKey or serviceUrl must be provided');
    }

    const messages = generateCommitMessageChatCompletionPrompt(diff);
    channel.appendLine(`[generateCommitMessage] messages: ${JSON.stringify(messages, null, 2)}`);

    let data, res;

    if (serviceUrl) {
        res = await axios({
            url: serviceUrl,
            method: 'POST',
            data: {
                messages: messages,
            },
            headers: {
                'content-type': 'application/json'
            }
        });
    } else {
        const openAI = new OpenAIApi(new Configuration({
            apiKey: apiKey
        }));

        channel.appendLine(`[generateCommitMessage] openai response before`);

        res = await openAI.createChatCompletion(
            {
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0,
                ['top_p']: 0.1,
                ['max_tokens']: 196
            }
        );

        channel.appendLine(`[generateCommitMessage] openai response: ${JSON.stringify(res)}`);
    }

    data = res.data;

    // @ts-ignore
    const message = data?.choices[0].message;
    const commitMessage = message?.content;

    if (commitMessage) {
        const alignedCommitMessage = trimNewLines(commitMessage, delimeter);
        return alignedCommitMessage;
    }

    return;
};