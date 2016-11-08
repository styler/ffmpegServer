/// <reference path="../typings/index.d.ts" />

import * as express from 'express';
import * as fileUpload from 'express-fileupload';
import * as randomstring  from 'randomstring';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';

var PORT = 80;

var command = new ffmpeg();
var app = express();
app.use(fileUpload());

var link = "Not created";

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

app.post('/upload', function(req, res) {
    var sampleFile;

    if (!req.files) {
        res.send("Please select a file");
        return;
    }
    if (!/video\/([a-z 0-9]*)/.test(req.files.sampleFile.mimetype)) {
        res.send("That is not a video");
        return;
    }
    if (req.files.sampleFile.mimetype === "video/mp4") {
      var mp42mp4 = true;
    } else {
      var mp42mp4 = false;
    }


    var exists = true;
    do {
        var leString = randomstring.generate({
            length: 5,
            charset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_'
        });
        var check;
        var link = leString + ".mp4";
        try {
            check = fs.lstatSync('../tmp/' + link);
        }
        catch (e) {
            exists = false;
        }
    } while (exists);

    sampleFile = req.files.sampleFile;
    var extension = sampleFile.name.split(".");
    var exten = extension[extension.length - 1];
    if (mp42mp4) {
        leString = "TMP"+leString;
    }
    sampleFile.mv('../tmp/' + leString + "." + exten, (err) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
    });
    ffmpeg('../tmp/' + leString + "." + exten)
        .audioCodec('copy')
        .videoCodec('libx264')
        .on('error', (err) => {
            res.send('Cannot process video: ' + err.message);
        })
        .on('progress', function(progress) {
            console.log('Processing ' + link + ' : ' + progress.percent + '% done');
        })
        .on('end', () => {
            fs.unlink('../tmp/' + leString + "." + exten, (err) => {});
            res.send(`<a href="data:video/mp4;base64,${base64_encode("../tmp/" + link)}">The File</a>`);
            setTimeout(() => {
              fs.unlink('../tmp/' + link, (err) => {});
            }, 500);
        })
        .save('../tmp/' + link);
});

app.use(express.static('../html'));

app.listen(PORT, () => {
    console.log("Webserver is running on :" + PORT)
});
