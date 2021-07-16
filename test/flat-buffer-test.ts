import * as fs from 'fs';
import * as fc from '../src/fb/fb-coder'
import { flatbuffers } from "flatbuffers";

testFlatbuffer();

async function testFlatbuffer() {
    
/*
    let high: number = 2034947462;
    let low: number = -82087264; // 4212880032
    let value = (BigInt(high) << 32n);
    console.log(value.toString());
    value = BigInt(low >>> 0);
    console.log(value.toString());
    value = ((BigInt(high >>> 0) << 32n) | BigInt(low >>> 0)); 
    console.log(value.toString());
*/ 

    // test flat buffer
    var bfbs = fs.readFileSync('./src/fb/direction-v9.bfbs'); 
    var fbCoder = new fc.FlatBufferCoder(bfbs);
    
    let binary = fs.readFileSync('./test/flatbuffers1.data');

    var object = fbCoder.decode(binary);
    console.log(JSON.stringify(fbCoder.beautify(object, 'jsons'), null, 4));

    /*
    var buffer = fbCoder.encode(object);
    fs.writeFileSync('./test/flatbuffers.dap', buffer);
    
    var binary_ = fs.readFileSync('./test/flatbuffer.dap');
    var object_ = fbCoder.decode(binary);

    console.log(JSON.stringify(object_, null, 4));
    */
    
}