import test from 'node:test';
import assert from 'node:assert/strict';
import {validCover,MAX_COVER_CHARS} from '../lib/photos.ts';
import {emptyLedger,validateLedger} from '../lib/model.ts';
const jpeg='data:image/jpeg;base64,/9j/2Q==';
test('local covers survive backups and old backups remain valid',()=>{
 const d={...emptyLedger(),covers:{'bottle:b1':jpeg}};
 assert.deepEqual(validateLedger(JSON.parse(JSON.stringify(d))).covers,d.covers);
 assert.doesNotThrow(()=>validateLedger(emptyLedger()));
});
test('remote, SVG, broken and excessive cover data cannot be imported',()=>{
 for(const src of ['https://example.com/photo.jpg','data:image/svg+xml;base64,abc','javascript:alert(1)','data:image/jpeg;base64,<script>',jpeg+'A'.repeat(MAX_COVER_CHARS)]){
  assert.equal(validCover(src),false);assert.throws(()=>validateLedger({...emptyLedger(),covers:{'bottle:b1':src}}));
 }
 assert.throws(()=>validateLedger({...emptyLedger(),covers:[]}));
 assert.throws(()=>validateLedger({...emptyLedger(),covers:{bad:jpeg}}));
});
