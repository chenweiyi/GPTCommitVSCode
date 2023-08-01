# GPT Commit

VS Code extension which helps to generate AI commit messages using ChatGPT.

## Features

You can generate commit message by pressing 'Generate AI commit' button in source control tab:

![Example of usage](assets/images/example.gif)

> Tip: You could also generate commit from command pallete by calling 'Generate AI commit' command.

## Requirements

Method 1:

You need Open AI API Key to make this extension work. You can get your API key from [OpenAI](https://platform.openai.com/account/api-keys). You should config `openAI.apiKey` by use command `gptcommit.registerOpenAiKey`


Method 2:

You need Custom Service for request data. You can use similary to open ai request `/v1/chat/completions`. You
should config `thirdParty.serviceUrl` eg: `http://localhost:3000/v1/chat/completions` by use command `gptcommit.registerThirdPartyServiceUrl`.

> Tip: Choose either method 1 or method 2. If both are configured, method 2 takes priority.


## Extension Settings

GPT Commit extension contributes the following settings:

* `gptcommit.openAI.apiKey`: OpenAI API Key. Needed for generating AI commit messages
* `gptcommit.appearance.delimeter`: Delimeter between commit lines
* `gptcommit.registerThirdPartyServiceUrl`: Config custom service address

## Release Notes

### 1.0.0
Initial release of GPT Commit

### 1.0.1
Updated icons

### 1.0.2
Fixed UX

### 1.0.3
Added Open AI API Key input prompt

### 1.0.4
Updated commit formatting. Added new setting

### 1.0.5
Support for custom services

## License

Released under [MIT](/LICENSE) by [@dmytrobaida](https://github.com/dmytrobaida).