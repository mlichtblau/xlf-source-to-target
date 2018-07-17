#!/usr/bin/env node

import '../polyfills'
import { Builder, Parser } from 'xml2js';
import commander = require('commander');
import fs = require('fs');
import {Command} from 'commander';

export class Main {

    static run() {
        this.initializeCommander(commander);
        const inputFile = commander['I'];
        const outputFile = commander['O'];
        const fileformat = commander['F'] || 'xlf';
        if (!inputFile || !outputFile) throw Error('Please provide valid files');
        if (!this.correctFilename(inputFile, fileformat)) throw Error('Please provide input-file in .xlf format');
        if (!this.correctFilename(outputFile, fileformat)) throw Error('Please provide output-file in .xlf format');
        const translator = FormatTranslator.getTranslator(fileformat);
        fs.readFile(inputFile, 'utf8', (err, inputXMLData) => {
            if (err) throw err;
            translator.translateXML(inputXMLData, (outputXMLData: string) => {
                fs.writeFile(outputFile, outputXMLData, 'utf8', (err: any) => {
                    if (err) throw err;
                    console.log('File successfully translated!');
                });
            })
        });
    }


    private static correctFilename(filename: string, ending: string): boolean {
        return filename.substr(filename.length - ending.length) == ending
    }

    private static initializeCommander(commander: Command) {
        commander
            .version('1.0.0')
            .description('Translate xlf files with source language as target language')
            .option('-i <inputfile>', 'Input File')
            .option('-o <outputfile>', 'Outputfile File')
            .option('-f <format>', 'Fileformat')
            .parse(process.argv);
    }
}

abstract class FormatTranslator {

    static getTranslator(fileformat: string): FormatTranslator {
        switch (fileformat) {
            case 'xlf':
                return new XLFFormatTranslator();
                break;
            case 'xlf2':
                throw new Error('xlf2 is currently not supported');
                break;
            case 'xmb':
                throw new Error('xmb is currently not supported');
                break;
            default:
                throw new Error('Fileformat not supported');
        }
    }

    abstract translateXML(inputXML: string, cb: Function): void;

}

class XLFFormatTranslator extends FormatTranslator {
    parser = new Parser();
    builder = new Builder();

    translateXML(inputXML: string, cb: Function): void {
        this.parser.parseString(inputXML, (error: any, jsonData: any) => {
            jsonData['xliff']['file'][0]['body'][0]['trans-unit'] =
                jsonData['xliff']['file'][0]['body'][0]['trans-unit'].map((el: any) => {
                    el['target'] = el['source'];
                    return el;
                });
            const outputXMLData = this.builder.buildObject(jsonData);
            cb(outputXMLData);
        });
    }

}

Main.run();