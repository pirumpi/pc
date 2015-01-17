var exec = require('child_process').exec,
    os = require('os'),
    get = require('get'),
    Promise = require('promise');

function PC(){}

PC.prototype.memory = function(){
  return {
      free: os.freemem(),
      total: os.totalmem()
    };
};

PC.prototype.cpu = function(){
  var cpu = os.cpus();
  return {
    model: cpu[0].model,
    speed: cpu[0].speed,
    threads: cpu.length
  };
};

PC.prototype.hostname = function(){
  return { name: os.hostname() };
};

PC.prototype.uptime = function(){
  return { time: os.uptime() };
};

PC.prototype.networkInterfaces = function(){
  return os.networkInterfaces();
};

PC.prototype.tempDir = function(){
    return os.tempDir();
};

PC.prototype.publicIP = function(){
    return new Promise(function(resolve,reject){
        get('http://api.ipify.org?format=json').asString(function(err,res){
            return err ? reject(err):resolve(JSON.parse(res));
        });
    });
};

PC.prototype.drives = function(){
  return new Promise(function(resolve, reject){
      var errorHandler = function(err){ reject(err); };

      execP('wmic logicaldisk get name').then(function(stdout){

          var names = [], container= [], drives = [], promiseList = [];

          transforArr(stdout, names);
          names.forEach(function(name){
              promiseList.push(execP('wmic logicaldisk where "name=\''+name+'\'" get description'));
              promiseList.push(execP('wmic logicaldisk where "name=\''+name+'\'" get filesystem'));
              promiseList.push(execP('wmic logicaldisk where "name=\''+name+'\'" get freespace'));
              promiseList.push(execP('wmic logicaldisk where "name=\''+name+'\'" get size'));
              promiseList.push(execP('wmic logicaldisk where "name=\''+name+'\'" get volumename'));
          });

          Promise.all(promiseList).then(function(results){
              results.forEach(function(responseStr){
                  var temp = [];
                  transforArr(responseStr, temp);
                  container.push(temp[0]);
              });
              names.forEach(function(name){
                  drives.push({
                     name: name,
                      description: container.shift(),
                      fileSystem: container.shift(),
                      freeSpace: container.shift(),
                      size: container.shift(),
                      volumeName: container.shift()
                  });
              })
              resolve(drives);
          }, errorHandler);
      }, errorHandler);
  });
};

PC.prototype.users = function(){
    return new Promise(function(resolve, reject){
        var errorHandler = function(err){ reject(err);};

        execP('wmic useraccount get name').then(function(stdout) {
            var names = [], container = [], users = [], promiseList = [];

            transforArr(stdout, names);
            names.forEach(function(name){
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get accounttype'));
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get domain'));
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get fullname'));
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get description'));
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get passwordchangeable'));
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get passwordexpires'));
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get passwordrequired'));
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get sid'));
                promiseList.push(execP('wmic useraccount where "name=\''+name+'\'" get status'));
            });
            Promise.all(promiseList).then(function(results){
                results.forEach(function(responseStr){
                   var temp = [];
                    transforArr(responseStr, temp);
                    container.push(temp[0]);
                });
                names.forEach(function(name){
                   users.push({
                       name: name,
                       accountType: container.shift(),
                       domain: container.shift(),
                       fullName: container.shift(),
                       description: container.shift(),
                       passwordChangeable: container.shift(),
                       passwordExpires: container.shift(),
                       passwordRequired: container.shift(),
                       sid: container.shift(),
                       status: container.shift()
                   });
                });
                resolve(users);
            }, errorHandler);
        }, errorHandler);

    });
};

PC.prototype.getAll = function(){
    var self = this;
  return new Promise(function(resolve, reject){
   var errorHandler = function(err){ reject(err); };
     Promise.all([self.publicIP(), self.drives(), self.users()]).then(function(info){
         reject({
             memory: self.memory(),
             cpu: self.cpu(),
             hostname: self.hostname(),
             uptime: self.uptime(),
             networkInterface: self.networkInterfaces(),
             publicIP: info[0],
             drives: info[1],
             users: info[2]
         });
     }, errorHandler);
  });
};

var execP = function(arg){
    return new Promise(function(resolve, reject){
        exec(arg, function(err, stdout, stdoerr){
           return err ? reject(err) : resolve(stdout);
        });
    });
};

var transforArr = function(str, arr){
    var list = str.split('\n');
    list.forEach(function(item){
        arr.push(item.replace(/\s+|\r+/g, ''));
    });
    cleanArray(arr);
};

var cleanArray = function(arr){
    if(arr.length < 4) { console.log('BARD', arr); throw 'wrong number';}
    arr.pop();
    arr.pop();
    arr.shift();
};

module.exports = new PC();
