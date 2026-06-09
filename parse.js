const fs = require('fs');
const xml = fs.readFileSync('header_xml.txt', 'utf8');
const trs = xml.split('</w:tr>');
trs.forEach((tr, i) => {
  if(!tr.includes('<w:tc>')) return;
  console.log('\nROW ' + i);
  const tcs = tr.split('</w:tc>');
  tcs.forEach((tc, j) => {
    if(!tc.includes('<w:tcW')) return;
    const w = tc.match(/<w:tcW w:w="(\d+)"/)?.[1];
    const span = tc.match(/<w:gridSpan w:val="(\d+)"/)?.[1] || 1;
    const vMergeMatch = tc.match(/<w:vMerge(?: w:val="(restart|continue)")?\/>/);
    const vMerge = vMergeMatch ? (vMergeMatch[1] || 'continue') : 'none';
    const text = tc.replace(/<[^>]+>/g, '').trim();
    const shd = tc.match(/<w:shd w:val="clear" w:color="auto" w:fill="([0-9A-Fa-f]+)"/)?.[1] || 'none';
    console.log(`  Col ${j}: w=${w}, span=${span}, vMerge=${vMerge}, shd=${shd}, text='${text}'`);
  });
});
