
//In background.js, this is what happens in the background when the popup is not open.
//You could possibly put your code here for web scraping and the right click stuff

var highlightedText = "HTN 2019 Submission! A web extension to help with research and studying.";

var author;
var websiteTitle ;
var articleTitle;
var url;
var publicationDate;

var title;
var as;

var module = require('./index');
                
/*var test = async function() {

    var keywords = await module.keyPhraseExtraction(module.textAnalyticsClient, highlightedText);
    
    var toSearch = "";
    
    for (var k of keywords[0].keyPhrases) {
    
        console.log(k);
        toSearch += " " + k;
    }
    
    var suggestedLinks = await module.webSearch(module.webSearchApiClient, toSearch, chrome.storage.sync);

    console.log("32 " + suggestedLinks);
}

test();*/

chrome.runtime.onInstalled.addListener(function () {
    
    var context = "selection";
    var id2 = chrome.contextMenus.create({
        "title" : "StudyBud: Get relevant links",
        "contexts" : [context],
        "id" : "0"
    });
});

chrome.contextMenus.onClicked.addListener(
    async function (info, tab) {
        
        switch (info.menuItemId) {

            case "0":
            
                highlightedText = info.selectionText;
                
                var keywords = await module.keyPhraseExtraction(module.textAnalyticsClient, highlightedText);

                chrome.storage.sync.set({
                    "keywords": keywords
                });
                
                var toSearch = "";
                
                for (var k of keywords[0].keyPhrases) {
                
                    toSearch += " " + k;
                }

                module.webSearch(module.webSearchApiClient, toSearch, chrome.storage.sync);

                break;
        }
    }
);

chrome.browserAction.onClicked.addListener(function(tab) {

    chrome.tabs.executeScript(null, {
        
        code: 'alert("check");'
      
    });

    var articleTitle = tab.title;
    var url = tab.url;

    var websiteTitle;
    var publicationDate;
    var author;

    var as = tab.evaluate("//*[contains(@class, 'author')]", tab, null, XPathResult.ANY_TYPE, null);
    if (as != null && as != undefined) {

        for (var a of Object.keys(as)) {	

            if (a != null && a.textContent != undefined) {
                
                if (a.textContent.contains('by ')) {

                    author = a.textContent.split('by ')[1];
                    break;
                }

                if (a.textContent.contains('By ')) {

                    author = a.textContent.split('By ')[1];
                    break;
                }

                author = a.textContent;
            }
        }
    }

    as = tab.evaluate("//*[contains(@class, 'date')]", tab, null, XPathResult.ANY_TYPE, null); 
    if (as != null && as != undefined) {

        for (var a of Object.keys(as)) {

            if (a != null && a.textContent != undefined) {
            
                publicationDate = a.textContent;
            }
        }
    }

    if (url != undefined && url != null) {

        if (url.includes("http://")) {
        
            if (url.includes("www")) {

                websiteTitle = url.substr(7).split(".")[1];
            }

            else {
                
                websiteTitle = url.substr(7).split(".")[0];
            }
        }

        else if (url.includes("https://") ) {
        
            if (url.includes("www")) {

                websiteTitle = url.substr(8).split(".")[1];
            }

            else {
                
                websiteTitle = url.substr(8).split(".")[0];
            }
        }
    }

    chrome.storage.sync.set({"articleTitle": articleTitle,
        "url" : url,
        "websiteTitle" : websiteTitle,
        "publicationDate" : publicationDate,
        "author" : author
    });

    alert(tab.url);
})
