import * as vscode from 'vscode';
import { tmpdir } from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';

import generateAICommitMessage from './gptcommit';

async function getGitApi() {
	const gitEntension = vscode.extensions.getExtension('vscode.git');

	if (!gitEntension) {
		return;
	}

	if (!gitEntension.isActive) {
		await gitEntension.activate();
	}

	const gitApi = gitEntension.exports?.getAPI(1);

	return gitApi;
}

function getGenerateMsgToFile() {
	const configuration = vscode.workspace.getConfiguration('gptcommit');
	const generateMsgToFile = configuration.get<boolean>('output.generateMsgToFile');
	return generateMsgToFile;
}

function getOpenAiApiKey() {
	const configuration = vscode.workspace.getConfiguration('gptcommit');
	const apiKey = configuration.get<string>('openAI.apiKey');
	return apiKey;
}

async function setOpenAiApiKey(apiKey: string) {
	const configuration = vscode.workspace.getConfiguration('gptcommit');
	await configuration.update('openAI.apiKey', apiKey, vscode.ConfigurationTarget.Global);
}

async function setServiceUrl(serviceUrl: string) {
	const configuration = vscode.workspace.getConfiguration('gptcommit');
	await configuration.update('thirdParty.serviceUrl', serviceUrl, vscode.ConfigurationTarget.Global);
}

function getDelimeter() {
	const configuration = vscode.workspace.getConfiguration('gptcommit');
	const delimeter = configuration.get<string>('appearance.delimeter');
	if (delimeter?.trim() === '') {
		return;
	}
	return delimeter;
}

function getThirdPartyServiceUrl() {
	const configuration = vscode.workspace.getConfiguration('gptcommit');
	const hostUrl = configuration.get<string>('thirdParty.serviceUrl');
	if (hostUrl?.trim() === '') {
		return;
	}
	return hostUrl;
}

async function getRespository() {
	const gitApi = await getGitApi();
	const respository = gitApi?.repositories[0];
	return respository;
}

async function setRepositoryCommitMessage(commitMessage: string) {
	const respository = await getRespository();

	if (!respository) {
		return;
	}

	respository.inputBox.value = commitMessage;
}

async function openFileCommitMessage({
	context, channel, commitMessage
}: {
	context: vscode.ExtensionContext, channel: vscode.OutputChannel, commitMessage: string
}) {
	const uid = randomUUID();
	const tmpMsgFile = path.join(tmpdir(), `vscode-gptcommit-${uid}.txt`);
	channel.appendLine(`[openFileCommitMessage] tmpMsgFile path: ${tmpMsgFile}`);
	await vscode.workspace.fs.writeFile(vscode.Uri.file(tmpMsgFile), Buffer.from(commitMessage, 'utf8'));
	const editor = vscode.window.activeTextEditor;
	const doc = await vscode.workspace.openTextDocument(tmpMsgFile);
	await vscode.window.showTextDocument(doc, {
		preview: false,
		viewColumn: editor ? editor.viewColumn : undefined
	});
	
	let saveFile = vscode.workspace.onDidSaveTextDocument(async (doc) => {
		if (doc.fileName === tmpMsgFile) {
			const respository = await getRespository();
			if (!respository) {
				return;
			}
			respository.inputBox.value = doc.getText();
		}
	});

	// let deleteFile = vscode.workspace.onDidCloseTextDocument(async (doc) => {
	// 	if (doc.fileName === tmpMsgFile) {
	// 		await vscode.workspace.fs.delete(vscode.Uri.file(tmpMsgFile));
	// 	}
	// });
	context.subscriptions.push(saveFile);
	// context.subscriptions.push(deleteFile);
}

async function selectOpenAiApiKey() {
	const apiKey = await vscode.window.showInputBox({
		title: 'Please enter your OpenAi API Key',
	});

	if (!apiKey || apiKey.trim() === '') {
		vscode.window.showErrorMessage('apiKey should not be empty!');
		return;
	}

	await setOpenAiApiKey(apiKey);
	return apiKey;
}

async function selectThirdPartyServiceUrl () {
	const serviceUrl = await vscode.window.showInputBox({
		title: 'Please enter your custom service url',
	});

	if (!serviceUrl || serviceUrl.trim() === '') {
		vscode.window.showErrorMessage('serviceUrl should not be empty!');
		return;
	}

	await setServiceUrl(serviceUrl);
	return serviceUrl;
}

function generateAICommitCommand(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
	let disposable = vscode.commands.registerCommand('gptcommit.generateAICommit', async () => {
		let apiKey = getOpenAiApiKey();
		let serviceUrl = getThirdPartyServiceUrl();
		const isGetGenerateMsgToFile = getGenerateMsgToFile();
	
		if (!apiKey && !serviceUrl) {

			const options:vscode.QuickPickItem[] = [{
				label: 'Chatgpt',
				description: 'use OpenAI Chatgpt service, need openAI.apiKey',
			}, {
				label: 'Custom',
				description: 'use custom service, need thirdParty.serviceUrl, high priority over OpenAI service',
			}];

			const result = await vscode.window.showQuickPick(options, {
				title: `What kind of service to choose?`,
			});

			if (result?.label === 'Chatgpt') {
				apiKey = await selectOpenAiApiKey();
			} else if (result?.label === 'Custom') {
				serviceUrl = await selectThirdPartyServiceUrl();
			} else {
				vscode.window.showErrorMessage('You should set OpenAi API Key Or Custom service url before extension using!');
				return;
			}

		}
	
		const delimeter = getDelimeter();
		const commitMessage = await generateAICommitMessage({channel, apiKey, delimeter, serviceUrl});
	
		if (!commitMessage) {
			return;
		}

		if (isGetGenerateMsgToFile) {
			await openFileCommitMessage({
				context,
				channel,
				commitMessage,
			});
		} else {
			await setRepositoryCommitMessage(commitMessage);
		}
	});
	context.subscriptions.push(disposable);
}

function registerOpenAiKeyCommand(context: vscode.ExtensionContext) {
	let command = vscode.commands.registerCommand('gptcommit.registerOpenAiKey', () => {
		selectOpenAiApiKey();
	});

	context.subscriptions.push(command);
}

function registerServiceUrlCommand(context: vscode.ExtensionContext) {
	let command = vscode.commands.registerCommand('gptcommit.registerThirdPartyServiceUrl', () => {
		selectThirdPartyServiceUrl();
	});

	context.subscriptions.push(command);
}

export function activate(context: vscode.ExtensionContext) {
	let channel = vscode.window.createOutputChannel('GPT Commit');
	context.subscriptions.push(channel);
	generateAICommitCommand(context, channel);
	registerOpenAiKeyCommand(context);
	registerServiceUrlCommand(context);

}

export function deactivate() { }
