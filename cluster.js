var cluster = require('cluster');
var workers = require('./workers.js');


if(cluster.isMaster){
  var nr_of_workers = 2;
  
  for(var i=0;i<nr_of_workers;i++){
    cluster.fork();
  }

  cluster.on('online', function(worker){
    console.log('Worker' +worker.process.pid+' is online');
  });
  
  cluster.on('exit', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
  });

}else{
  workers();
}