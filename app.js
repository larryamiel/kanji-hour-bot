const request = require( 'request' );
const cheerio = require( 'cheerio' );
const fs = require( 'fs' );

const Twit = require( 'twit' );
const jishoApi = new require('unofficial-jisho-api');
const jisho = new jishoApi();
const express = require('express');

var config = require( './config.js' );
const T = new Twit( config );

var http = require('http');

const port = 4200;
const app = express();

app.listen( port );
console.log( 'Kanji Hour Bot is runnin on port: ' + port );

// kanjiScrape();
kanjiSearch();

setInterval( kanjiSearch, 1000 * 60 * 60 );

function kanjiSearch() {

    var kanjiFile = fs.readFileSync( './assets/kanji.json', 'utf8')
    var kanjiObject = JSON.parse( kanjiFile );

    console.log( kanjiObject.kanjiList[ kanjiObject.index ] );

    jisho.searchForKanji( kanjiObject.kanjiList[ kanjiObject.index ] ).then(result => {

        var message = 'Kanji: ' + kanjiObject.kanjiList[ kanjiObject.index ] + '\n' +
                    'JLPT Level: ' + result.jlptLevel + '\n' +
                    'Meaning: ' + result.meaning + '\n' +
                    'Kunyomi: ' + JSON.stringify(result.kunyomi) + '\n' +
                    'Onyomi: ' + JSON.stringify(result.onyomi) + '\n' + '\n';

        message += '#japanese #kanji #learningJapanese #jisho'

        sendTweet( message, JSON.stringify(result.strokeOrderDiagramUri) );

        if( kanjiObject.index < kanjiObject.kanjiList.length ) {
            kanjiObject.index += 1;
        }
        else {
            kanjiObject.index = 0;
        }

        var kanjiJSONString = JSON.stringify( kanjiObject );
        
        fs.writeFile( './assets/kanji.json', kanjiJSONString, (err) => {
        
            if( err ) { console.log( err ); }
            else { console.log( 'Kanji Saved' ) }
        
        } );

    });

}

function sendTweet( message, imageURI ) {

    imageURI = imageURI.replace(/['"]+/g, '');

    http.get(imageURI, (resp) => {
        resp.setEncoding('base64');
        body = "";
        resp.on('data', (data) => { body += data});
        resp.on('end', () => {
            
            T.post('media/upload', { media_data: body }, function(err, data, response) {

                var id = data.media_id_string;

                console.log( 'Media ID: ' + id );
    
                T.post('statuses/update', { status: message, media_ids: [id] }, function(err, data, response) {
            
                    if( err ) { console.log( 'Error: ' + err ) }
                    else { console.log( 'Tweet Sent...' ) }
            
                });
    
            });

        });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });

}

function kanjiScrape() {

    var url = 'http://kanjicards.org/kanji-list-by-grade.html';

    var kanjiList = [];
    
    request( url, function( err, res, body ) {
    
        $ = cheerio.load( body );
    
        $('#main-copy a').each( function ( iter, kanjiObject ) {
    
            var kanji = $( kanjiObject ).text();
            kanjiList.push( kanji );
    
            console.log( kanji );
    
        });
    
        var kanjiJSON = {
    
            index: 0,
            kanjiList: kanjiList
    
        };
    
        var kanjiJSONString = JSON.stringify( kanjiJSON );
    
        fs.writeFile( './assets/kanji.json', kanjiJSONString, (err) => {
    
            if( err ) { console.log( err ); }
            else { console.log( err ) }
    
        } );
    
    }); 

}
