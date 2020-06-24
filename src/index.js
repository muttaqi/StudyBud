"use strict";

require('dotenv').config();
const os = require("os");
const CognitiveServicesCredentials = require("@azure/ms-rest-js");
const CSC = require('ms-rest-azure').CognitiveServicesCredentials;
const TextAnalyticsAPIClient = require("@azure/cognitiveservices-textanalytics");
const WebSearchAPIClient = require('azure-cognitiveservices-websearch');

const ta_subscription_key = process.env.TEXT_ANALYTICS_SUBSCRIPTION_KEY;
const bs_subscription_key = process.env.BING_SEARCH_SUBSCRIPTION_KEY;

const endpoint = process.env.ENDPOINT;

console.log(ta_subscription_key);
console.log(bs_subscription_key);
console.log(endpoint);

const ta_creds = new CognitiveServicesCredentials.ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': ta_subscription_key } });
const bs_creds = new CSC(bs_subscription_key);

const textAnalyticsClient = new TextAnalyticsAPIClient.TextAnalyticsClient(ta_creds, endpoint);
const webSearchApiClient = new WebSearchAPIClient(bs_creds);

async function keyPhraseExtraction(client, highlightedText){

    const keyPhrasesInput = {
        documents: [
            {
                language: "en",
                id: "1",
                text: highlightedText
            }
        ]
    };

    const keyPhraseResult = await client.keyPhrases({
        multiLanguageBatchInput: keyPhrasesInput
    });
    //console.log(keyPhraseResult.documents);
    //console.log(os.EOL);
    
    return keyPhraseResult.documents;
}

function webSearch(client, toSearch, chromeStorageSync) {

    client.web.search(toSearch).then((result) => {

        if (result["webPages"]) {

            alert("Suggested links stored in the research tab");
            console.log(result["webPages"].value);
            chromeStorageSync.set({

                "suggestedLinks": result["webPages"].value
            });
        } else {

            alert(`No ${properties[i]} data`);
        }
    }).catch((err) => {

        throw err;
    });
}

//keyPhraseExtraction(textAnalyticsClient);
module.exports = {

    keyPhraseExtraction: keyPhraseExtraction,
    textAnalyticsClient: textAnalyticsClient,
    
    webSearch: webSearch,
    webSearchApiClient: webSearchApiClient
};