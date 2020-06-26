//On load; use this place to initialize things
//chrome.runtime.onInstalled.addListener(function(){
//chrome.storage.sync.set({})
//});

//Use this place for things that happen when the popup is open; may want to move some of the MLA citation generation stuff

const WolframAlphaAPI = require('wolfram-alpha-api');
const waApi = WolframAlphaAPI('APP_ID');

var isMLA;
var suggestedLinks;
var notes = [];
var currentNoteIndex = -1;
var URL;
var noteTA;
var titleTA;
var linkWritten
var parentNode;

let authorIn;
let titleIn;
let webTitleIn ;
let orgPublisherIn;
let URLIn;
let pubDateIn;
let LocationIn;
let citationText

class Note {

    constructor(title, links) {

        this.title = title;
        this.links = links;
    }
}

function getContent(note) {

    var content = "";

    if (note.links != undefined) {
       
        for (var i = 0; i < note.links.length; i ++) {

            l = note.links[i];

            if (i > 0) {
            
                content += "\n\n" + l[0] ;
            }

            else {

                content += l[0];
            }
        }
    }

    return content;
}

function getNode(note) {

    var node = document.createElement("li");
    var textNode = document.createElement("h6");
    textNode.textContent = note.title;

    node.onclick = function() {

        titleTA.value = note.title;

        noteTA.value = getContent(note);

        for (var i = 0; i < notes.length; i ++) {

            if (note == notes[i]) {

                currentNoteIndex = i;

                break;
            }
        }
    }

    node.appendChild(textNode);

    return node;
}

function updateNodes() {
    
    while (parentNode.firstChild) {

        parentNode.removeChild(parentNode.firstChild);
    }

    for (var i = 0; i < notes.length; i ++) {
    
        var n = notes[i];
        
        parentNode.appendChild(getNode(n));
    }
}

function deleteNote() {

    if (currentNoteIndex >= 0) {

        notes.splice(currentNoteIndex, 1);
        currentNoteIndex = -1
        noteTA.value = "";
        titleTA.value = "";

        updateNodes();
    }
}

function save() {

    var title = titleTA.value;
    var content = noteTA.value;

    var sections = content.split("\n\n")
    var links = [];

    if (currentNoteIndex < 0) {

        for (var s of sections) {

            if (s != null || s != undefined) {

                if (URL != undefined) {
                
                    links.push([s, URL]);
                }

                else {

                    links.push([s, ""]);
                }
            }
        }

        var newNote = new Note(title, links);

        notes.push(newNote);
        currentNoteIndex = notes.length - 1;
        
        updateNodes();
    }
    
    else {

        for (var i = 0; i < sections.length; i ++) {

            var section = sections[i];

            if (section != null || section != undefined) {

                if (i >= notes[currentNoteIndex].links.length) {

                    if (URL != undefined) {
                    
                        links.push([section, URL]);
                    }
    
                    else {
    
                        links.push([section, ""]);
                    }
                }

                else {

                    var done = false;
                    
                    for (var l of notes[currentNoteIndex].links) {

                        if (section.includes(l[0])) {

                            links.push([section, l[1]]);
                            done = true;
                            break;
                        }
                    }

                    if (!done) {

                        if (Url != undefined) {
                        
                            links.push([section, URL]);
                        }
        
                        else {
        
                            links.push([section, ""]);
                        }
                    }
                }
            }
        }

        notes[currentNoteIndex].title = title;
        notes[currentNoteIndex].links = links;

        updateNodes();
    }

    chrome.storage.sync.set({"notes": notes});
    chrome.storage.sync.set({"currentNote": currentNoteIndex});
}

showWolframShort() {

    var toSearch = window.getSelection().toString();

    waApi.getShort(toSearch).then((data) => {

        window.getElementById("wolfram-search").textContent = data;
    });
}

window.onload = function () {

    linkWritten = document.getElementById("link-written");

    parentNode = document.getElementById("parent");
    
    noteTA = document.getElementById("text_field");
    titleTA = document.getElementById("NOTETITLE");

    document.getElementById("open-link-written").onclick = function() {

        if (linkWritten.textContent != "Click on a paragraph to get the link at which you wrote it" && linkWritten.textContent != "" && linkWritten.textContent != undefined) {

            window.open(linkWritten.textContent, "_blank");
        }
    }

    var newNote = document.getElementById("new-note");
    newNote.onclick = function() {

        save();

        currentNoteIndex = -1;
        noteTA.value = "";
        titleTA.value = "";
    }

    noteTA.onclick = function() {

        save();

        var content = noteTA.value;
        var selectionI = noteTA.selectionStart;

        var before = content.substring(0, selectionI);
    
        if (currentNoteIndex >= 0) {

            var currentNote = notes[currentNoteIndex];
            for (var i = 0; i < currentNote.links.length; i ++) {

                var l = currentNote.links[i];
                
                if (!before.includes(l[0])) {
                        
                    linkWritten.textContent = l[1];
                    break;
                }

                else if (i == currentNote.links.length - 1) {
                
                    if (content.substring(selectionI) === "") {

                        linkWritten.textContent = l[1];
                        break;
                    }

                    else {
                        
                        linkWritten.textContent = URL;
                        break;
                    }
                }
            }
        }

        else {

            linkWritten.textContent = URL;
        }
    }

    var mb = document.getElementById("saveButton");
    mb.addEventListener("click", save);
    document.getElementById("deleteButton").addEventListener("click", deleteNote);

    chrome.storage.sync.get('currentNote', function(result) {

        if (result.currentNote != undefined) {

            currentNoteIndex = result.currentNote;
        }

        else {

            currentNoteIndex = -1;
        }
    })

    chrome.storage.sync.get('notes', function(result) {

        if (result.notes != undefined) {

            notes = result.notes;

            for (var i = 0; i < notes.length; i ++) {
    
                var n = notes[i];
                
                parentNode.appendChild(getNode(n));
            }

            if (currentNoteIndex >= 0) {
                
                titleTA.value = notes[this.currentNoteIndex].title;
                this.noteTA.value = getContent(notes[this.currentNoteIndex]);
            }
        }

        else {

            notes = [];
        }
    });

    //SUGGESTED LINKS
    
    chrome.storage.sync.get('keywords', function(result) {

        if (result.keywords != undefined) {
        
            var keywords = result.keywords;

            var researchTab = document.getElementById("research-tab");

            for (var k of keywords[0].keyPhrases) {

                var newSpan = document.createElement("span");
                newSpan.setAttribute("class", "uk-badge uk-margin-small-left uk-margin-small-top");
                newSpan.textContent = k;
                researchTab.appendChild(newSpan);
            }
        }
    });
    
    chrome.storage.sync.get('suggestedLinks', function(result) {
        
        suggestedLinks = result.suggestedLinks;

        if (suggestedLinks != undefined) {
    
            var resourceList = document.getElementById("resource-list");
            
            for (var i = 0; i < suggestedLinks.length; i ++) {
    
                var link = suggestedLinks[i];
    
                if (i == 0) {

                    var title0 = document.getElementById("firstCardTitle");
                    title0.textContent = link.name;
    
                    title0.onclick = function() {
    
                        window.open(suggestedLinks[0].url, "_blank");
                    };
    
                    var info0 = document.getElementById("firstCardInfo");
                    info0.textContent = link.snippet;
                }
    
                else {
    
                    var newTitle = document.createElement("h6");
                    newTitle.textContent = link.name;
                    newTitle.setAttribute("class", "uk-card-title");
                    newTitle.setAttribute("id", i);

                    newTitle.onclick = function() {
    
                        window.open(suggestedLinks[this.id].url, "_blank");
                    };
    
                    var newInfo = document.createElement("p");
                    newInfo.textContent = link.snippet;
                    
                    var newDiv = document.createElement("div");
                    newDiv.setAttribute("class", "uk-card uk-card-default uk-card-body uk-card-size");
                    newDiv.appendChild(newTitle);
                    newDiv.appendChild(newInfo);
    
                    resourceList.appendChild(newDiv);
                }
            }
        }

        console.log(suggestedLinks);
    });

    //CITATION

    authorIn = document.getElementById("authorInput");
    titleIn = document.getElementById("titleInput");
    webTitleIn = document.getElementById("webTitleInput");
    orgPublisherIn = document.getElementById("organizationInput");
    URLIn = document.getElementById("URLInput");
    pubDateIn = document.getElementById("pubDateInput");
    LocationIn = document.getElementById("locationInput");

    let citationButton = document.getElementById("CitationsButton");
    let researchButton = document.getElementById("ResearchButton");
    let notesButton = document.getElementById("NotesButton");
    let MLAButton = document.getElementById("MLAButton");
    let APAButton = document.getElementById("APAButton");
    let submitButton = document.getElementById("submitButton");
    let saveButton = document.getElementById("saveButton");

    citationText = document.getElementById("citation");

    isMLA = true;

    chrome.storage.sync.get('citation', function(result) {

        if (result.citation != undefined && result.citation != null) {

            citationText.textContent = result.citation;
        }
    });

    chrome.storage.sync.get('articleTitle', function(result) {

        if (result.articleTitle != undefined && result.articleTitle != null) {

            titleIn.value = result.articleTitle;
        }
    });

    chrome.storage.sync.get('author', function(result) {

        if (result.author != undefined && result.author != null) {

            authorIn.value = result.author;
        }
    });

    chrome.storage.sync.get('websiteTitle', function(result) {

        if (result.websiteTitle != undefined && result.websiteTitle != null) {

            webTitleIn.value = result.websiteTitle;
        }
    });

    chrome.storage.sync.get('url', function(result) {

        if (result.url != undefined && result.url != null) {

            URLIn.value = result.url;
            URL = result.url;
        }
    });

    chrome.storage.sync.get('publicationDate', function(result) {
        
        if (result.publicationDate != undefined && result.publicationDate != null) {

            pubDateIn.value = result.publicationDate;
        }
    });

    chrome.storage.sync.get('location', function(result) {
        
        if (result.location != undefined && result.location != null) {

            LocationIn.value = result.location;
        }
    });

    chrome.storage.sync.get('publisher', function(result) {
        
        if (result.publisher != undefined && result.publisher != null) {

            orgPublisherIn.value = result.publisher;
        }
    });

    MLAButton.addEventListener("click", function () {
        isMLA = true;
    });

    APAButton.addEventListener("click", function () {
        isMLA = false;
    });

    submitButton.addEventListener("click", function () {
        
        if (isMLA === true) {

            var authors = authorIn.value.split(", ");
            var authorText = "";
            
            if (authors.length == 1) {

                if (authors[0] != "") {

                    var authorfl = authors[0].split(" ");

                    if (authorfl.length == 1) {

                        authorText = authors[0] + ". ";
                    }
                    
                    else if (authorfl.length == 2) {
                    
                        authorText = authorfl[1] + ", " + authorfl[0] + ". ";
                    }

                    else if (authorfl.length > 2) {

                        authorText = "";
                        for (var i = 0; i < authorfl.length; i ++) {

                            if (i > 0) {

                                authorText += authorfl[i] + " ";
                            }
                        }

                        authorText += authorfl[0] + ". ";
                    }
                }
            }
            
            else if (authors.length == 2) {

                if (authors[0] != "") {

                    var authorfl = authors[0].split(" ");

                    if (authorfl.length == 1) {

                        authorText = authors[0] + ", and ";
                    }
                    
                    else if (authorfl.length == 2) {
                    
                        authorText = authorfl[1] + ", " + authorfl[0] + ", and ";
                    }

                    else if (authorfl.length > 2) {

                        author = "";
                        for (var i = 0; i < authorfl.length; i ++) {

                            if (i > 0) {

                                authorText += authorfl[i] + " ";
                            }
                        }

                        authorText += authorfl[0] + ", and ";
                    }

                    authorText += authors[1] + ". ";
                }
            }

            else {

                for (var a of authors) {

                    if (a != "") {

                        var authorfl = a.split(" ");
    
                        if (authorfl.length == 1) {
    
                            author += a + ", ";
                        }
                        
                        else {
    
                            author += authorfl[authorfl.length - 1] + ", ";
                        }
                    }
                }

                authorText += "et al.";
            }

            var titleText = "";

            if (titleIn.value != "") {

                titleText = "\"" + titleIn.value + ".\" ";
            }

            var pubDateText = "";
            var orgPublisherText = "";
            var locationText = "";

            if (pubDateIn.value != "") {

                pubDateText = pubDateIn.value + ". ";

                if (orgPublisherIn.value != "") {
    
                    orgPublisherText = orgPublisherIn.value + ", ";
                }

                if (LocationIn.value != "") {
    
                    locationText = LocationIn.value + ", ";
                }
            }

            else {

                if (orgPublisherIn.value != "") {
    
                    orgPublisherText = orgPublisherIn.value + ". ";
                }

                if (LocationIn.value != "") {
    
                    locationText = LocationIn.value + ", ";
                }
            }
            
            var URLText = "";
            var webTitleText = "";

            if (URLIn.value != "") {

                URLText = URLIn.value + ". ";

                if (webTitleIn.value != "") {
    
                    webTitleText = webTitleIn.value + ", ";
                }
            }

            else {

                if (webTitleIn.value != "") {
    
                    webTitleText = webTitleIn.value + ". ";
                }
            }  

            var totalCitation = authorText + titleText + orgPublisherText + pubDateText + locationText + webTitleText + URLText;
            
            citationText.textContent = totalCitation;
        }

        else {

            var authorText = "";

            if (authorIn.value != "") {

                var authors = authorIn.value.split(", ");
                var authorText = "";
            
                for (var a of authors) {

                    var authorfl = a.split(" ");

                    for (var i = 0; i < authorfl.length; i ++) {

                        if (i == 0) {

                            authorText += authorfl[i] + ", ";
                        }

                        else {

                            authorText += authorfl[i] + ".";
                        }
                    }

                    authorText += ", ";
                }

                authorText = authorText.substring(0, authorText.length - 2) + ". ";
            }

            var titleText = "";
            var webTitleText = "";

            if (webTitleIn.value != "") {

                webTitleText = webTitleIn.value + ". ";

                if (titleIn.value != "") {
    
                    titleText = titleIn.value + ": ";
                }
            }

            else {

                if (titleIn.value != "") {
    
                    titleText = titleIn.value + ". ";
                }
            }

            var pubDateText = "";
            var orgPublisherText = "";
            var locationText = "";

            if (pubDateIn.value != "") {

                pubDateText = "(" + pubDateIn.value + "). ";
            }

            if (orgPublisherIn.value != "") {

                orgPublisherText = orgPublisherIn.value + ". ";
            }

            if (LocationIn.value != "") {

                locationText = LocationIn.value + ": ";
            }
            
            var URLText = "";

            if (URLIn.value != "") {

                dateText = "Retrieved from " + URLIn.value + ". ";
            }

            var totalCitation = authorText + pubDateText + titleText + webTitleText + locationText + orgPublisherText + URLText;
            
            citationText.textContent = totalCitation;
        }
    });
}

window.onunload = function() {

    this.save();

    chrome.storage.sync.set({
        "articleTitle": titleIn.value,
        "url" : URLIn.value,
        "websiteTitle" : webTitleIn.value,
        "publicationDate" : orgPublisherIn.value,
        "author" : authorIn.value,
        "publisher" : pubDateIn.value,
        "location" : LocationIn.value,
        "citation" : citationText.textContent
    });
}