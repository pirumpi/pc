var pc = require('./lib');

// pc.get(['cpu', 'memory', 'publicIP', 'share']).then(function(list){
//     console.log(list);
// }, function(err){
//     console.log('ERR',err)
// })

console.log(pc.tmpDir());
