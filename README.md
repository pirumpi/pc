PC
=======

An application that provides information about a computer. Such as available memory, installed application, drives spaces, etc. It is only supporting Windows right now but Linux and Mac support are coming soon.

##Install
```js
    npm install pc
```

Information Available
----------------------

- Memory
- CPU
- Hostname
- Uptime
- NetworkInterfaces
- Temporary Directory
- **Public IP**
- **Drives**
- **Users**
- **MAC**
- **Programs**
- **Share**
- **More coming soon**

Methods
--------
**Memory** Return computer's available memory
```js
  var pc = require('pc');

  pc.memory(); //return  { free: number, total: number }

```

**Hostname** Return the computer's hostname
```js
  pc.hostname(); //return { name: 'string' }
```

**Uptime** Return the system uptime in seconds
```js
  pc.uptime() //return { time: 'string' }

```
**tmpDir** Returns the operating system's default directory for temp files.
```js
pc.tmpDir() //return { location: 'string' }

```
**cpu** Returns an  objects containing information about each CPU/core installed.
```js
pc.cpu() //return { model: 'string', speed: number, threads: number };

```
**NetworkInterfaces** Get a list of network interfaces
```js
  pc.networkInterfaces();
  /*
    { lo0:
    [ { address: '::1', family: 'IPv6', internal: true },
    { address: 'fe80::1', family: 'IPv6', internal: true },
    { address: '127.0.0.1', family: 'IPv4', internal: true } ],
    en1:
    [ { address: 'fe80::cabc:c8ff:feef:f996', family: 'IPv6',
    internal: false },
    { address: '10.0.1.123', family: 'IPv4', internal: false } ],
    vmnet1: [ { address: '10.99.99.254', family: 'IPv4', internal: false } ],
    vmnet8: [ { address: '10.88.88.1', family: 'IPv4', internal: false } ],
    ppp0: [ { address: '10.2.0.231', family: 'IPv4', internal: false } ] }
  */
```

###The rest of the api return promises
I like to define an error handler function to deal with my promises errors,
```js
  var errorHandler = function(err){ console.log(err); throw err; };
```

**Public IP** Return the public IP of the computer. **Internet connection is required to call this method.**
```js
  pc.publicIP().then(function(ipInfo){
    console.log(ipInfo); //return { ip: ipaddress }
  }, errorHandler);
```
**Drives** Return an array of object with drive information.
```js
  pc.drives().then(function(drives){
    console.log(drives);
    /*
      [{
        name: 'string',
        description: 'string',
        fileSystem: 'string',
        freeSpace: number,
        size: number,
        volumeName: 'string'
    }]
    */
  }, errorHandler);
```
**Users** Return an array of existing users in the computer.
```js
  pc.users().then(function(users){
    console.log(users);
    /*
      [{
        name: 'string',
        accountType: number,
        domain: 'string',
        fullName: 'string',
        description: 'string',
        passwordChangeable: boolean,
        passwordExpires: boolean,
        passwordRequired: boolean,
        sid: 'string',
        status: 'string'
      }]
    */
  }, errorHandler);
```
**Mac** Return an array of nic info.
```js
pc.mac().then(function(list){
  console.log(list);
  /*
  [{
    interfaceIndex: number,
    name: 'string',
    macAddress: 'macaddress',
    manufacturer: 'string',
    timeOfLastReset: time
  }]
  */
}, errorHandler);
```
**Programs** Return an array with all the applications installed in the computer.
```js
pc.programs().then(function(list){
  console.log(list); // [{ name: 'string' }]
}, errorHandler);
```
**Programs** Return an array with all shares in the computer.
```js
pc.share().then(function(list){
  console.log(list);
  /*
  [{
    name: 'string',
    caption: 'string',
    path: 'string',
    type: number
  }]
  */
}, errorHandler);
```
Useful Methods
---------------
**getAll** Retrieve all the information from the computer
```js
  pc.getAll().then(function(everything){
    console.log(everything)
  }, errorHandler);
```
**get** Get an object with selected attributes
```js
  pc.get(['mac, publicIP, users']).then(function(results){
    console.log(results); //{ mac: [{object}], publicIP: 'ipaddress', users: [{object}] }
  }, errorHandler)
```
