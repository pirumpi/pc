var pc = require('./lib');

pc.get(['cpu']).then(function(cpu){
    console.log(cpu);
}, function(cpu){
    console.log('ERR',err)
 })
