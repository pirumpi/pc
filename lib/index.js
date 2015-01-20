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

PC.prototype.tmpDir = function(){
  return {location: os.tmpDir()};
};

PC.prototype.publicIP = function(){
  return new Promise(function(resolve,reject){
    get({uri:'http://api.ipify.org?format=json'}).asString(function(err,res){
      return err ? reject(err):resolve(JSON.parse(res));
    });
  });
};

PC.prototype.drives = function(){
  return new Promise(function(resolve, reject){
    var errorHandler = function(err){ reject(err); };

    execP('wmic logicaldisk get name').then(function(stdout){

      var names = [], container = [], drives = [], promiseList = [];

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
        });
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
    var publicIP = null;

    //This called is Internet dependent, so it is appropriate to remove it from the Promise all
    self.publicIP().then(function(ipData){
      publicIP = ipData;
    }, function(err){
      console.log('publicIP Error', err); //Not internet connection
    }).done(function(){
      Promise.all([self.drives(), self.users(), self.mac(), self.share(), self.programs()]).then(function(info){
        resolve({
          memory: self.memory(),
          cpu: self.cpu(),
          hostname: self.hostname(),
          uptime: self.uptime(),
          networkInterface: self.networkInterfaces(),
          publicIP: publicIP,
          drives: info[0],
          users: info[1],
          mac: info[2],
          share: info[3],
          programs: info[4]
        });
      }, errorHandler);
    })
  });
};

PC.prototype.get = function(listArr){
  var self = this;
  return new Promise(function(resolve, reject){
    var errorHandler = function(err){ reject(err);};
    var results = {}, internetPromise = [], promiseList = [],
    nonPromiseItems = ['memory', 'cpu', 'hostname', 'uptime', 'networkInterface'],
    internetDependent = ['publicIP'], orderName = [];

    if(!(listArr instanceof Array)) {
      reject('Non array argument error');
      throw 'Non array argument';
    }
    if(!listArr.length){ reject('Empty array'); throw 'Empty Array error'; }
    var clone = listArr.slice(0);

    var findNonPromiseItem = function(){
      for(var i = 0; i < nonPromiseItems.length; i++){
        var idx = clone.indexOf(nonPromiseItems[i]);
        if(idx !== -1){ return idx; }
      }
      return -1;
    };

    var findInternetDependentItems = function(){
      for(var i = 0; i < internetDependent.length; i++){
        var idx = clone.indexOf(internetDependent[i]);
        if(idx !== -1){ return idx; }
      }
      return -1;
    };

    var cleanInternetDependents = function(){
      var idx = findInternetDependentItems();
      if(idx !== -1){
        internetPromise.push(self[clone[idx]]());
        orderName[orderName.length] = clone[idx];
        clone.splice(idx, 1);
        cleanInternetDependents();
      }
    };

    var cleanList = function() {
      var idx = findNonPromiseItem();
      if (idx !== -1) {
        results[clone[idx]] = self[clone[idx]]();
        clone.splice(idx, 1);
        cleanList();
      }
    };
    cleanList();
    if(!clone.length && !internetPromise.length && !promiseList.length) { resolve(results); return; }

    cleanInternetDependents();

    var resolveAllPromises = function(IpFailed){
      if(IpFailed){ results['publicIP'] = ''; }
      if(!clone.length){ resolve(results); return; }
      orderName.length = 0;
      clone.forEach(function(name){
        promiseList.push(self[name]());
        orderName.push(name);
      });
      Promise.all(promiseList).then(function(list) {
        orderName.forEach(function (nm, e) {
          results[nm] = list[e];
        });
        resolve(results);
      });
    };

    if(internetPromise.length){
      Promise.all(internetPromise).then(function(res){
        orderName.forEach(function(n, i){
          results[n] = res[i];
        });
        resolveAllPromises();
      }, function() {
        resolveAllPromises(true);
      });

    }else if(clone.length){
      orderName.length = 0;
      clone.forEach(function(name){
        promiseList.push(self[name]());
        orderName.push(name);
      });
      Promise.all(promiseList).then(function(list){
        orderName.forEach(function(nm, e){
          results[nm] = list[e];
        });
        resolve(results);
      }, errorHandler);
    }
  });
};

PC.prototype.mac = function(){
  return new Promise(function(resolve, reject){
    var errorHandler = function(err){ reject(err); };
    execP('wmic nic get interfaceindex').then(function(stdout){
      var interfaceIndex = [], container = [], macs = [], promiseList = [];

      transforArr(stdout, interfaceIndex);
      interfaceIndex.forEach(function(idx){
        promiseList.push(execP('wmic nic where "interfaceindex=\''+idx+'\'" get name'));
        promiseList.push(execP('wmic nic where "interfaceindex=\''+idx+'\'" get macaddress'));
        promiseList.push(execP('wmic nic where "interfaceindex=\''+idx+'\'" get manufacturer'));
        promiseList.push(execP('wmic nic where "interfaceindex=\''+idx+'\'" get timeoflastreset'));
      });

      Promise.all(promiseList).then(function(results){
        results.forEach(function(responseStr){
          var temp = [];
          transforArr(responseStr, temp);
          container.push(temp[0]);
        });
        interfaceIndex.forEach(function(idx){
          macs.push({
            interfaceIndex: idx,
            name: container.shift(),
            macAddress: container.shift(),
            manufacturer: container.shift(),
            timeOfLastReset: container.shift()
          });
        });
        //remove items without mac addresses
        for(var i = macs.length -1; i >= 0; i--){
          if(macs[i].macAddress == ''){
            macs.splice(i,1);
          }
        }
        resolve(macs)
      }, errorHandler);
    }, errorHandler);
  });
};

PC.prototype.share = function(){
  return new Promise(function(resolve, reject) {
    var errorHandler = function (err) { reject(err); };
    execP('wmic share get name').then(function (stdout) {
      var names = [], container = [], shares = [], promiseList = [];

      transforArr(stdout, names);
      names.forEach(function (name) {
        promiseList.push(execP('wmic share where "name=\'' + name + '\'" get caption'));
        promiseList.push(execP('wmic share where "name=\'' + name + '\'" get path'));
        promiseList.push(execP('wmic share where "name=\'' + name + '\'" get type'));
      });

      Promise.all(promiseList).then(function (results) {
        results.forEach(function (responseStr) {
          var temp = [];
          transforArr(responseStr, temp);
          container.push(temp[0]);
        });
        names.forEach(function (name) {
          shares.push({
            name: name,
            caption: container.shift(),
            path: container.shift(),
            type: container.shift()
          });
        });
        resolve(shares);
      }, errorHandler);
    }, errorHandler);
  });
};

PC.prototype.programs = function(){
  return new Promise(function(resolve, reject){
    var errorHandler = function (err) { reject(err); };
    execP('wmic product get name').then(function (stdout) {
      var names = [], container = [], programs = [], promiseList = [];

      transforArr(stdout, names);
      names.forEach(function (name) {
        programs.push({
          name: name
        });
      });
      resolve(programs);
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
