var RESTCommand = require('restcommand').RESTCommand;
var RESTClient  = require('restclient').RESTClient;

var util   = require('util');

var stack  = [];
var timers = [];

function RESTCommandRecorderTask(){

    this.get = function(request, callback){
        console.log('get', arguments);

        var identifiers = request.getIdentifiers();

        if (identifiers !== undefined){
            var f_stack = stack.filter(function(item){
                return identifiers.indexOf(item.id) >= 0;
            });
        }else{
            f_stack = stack;
        }

        return callback(stack.map(function(item){item.timer = undefined; return item}));
    };

    this.create = function(request, callback){
        console.log('create', arguments);
        
        var data = request.getData();

        if (!data.hasOwnProperty("id")){
            return callback(null, "Identifier missing");
        }

        if (!data.hasOwnProperty("time")){
            return callback(null, "Job time missing");
        }

        if (!data.hasOwnProperty("job")){
            return callback(null, "Job name missing");
        }

        var now = new Date().getTime()/1000;

        if (now > data.time){
            return callback(null, "Job time expired");
        }

        var self = this;
        var timeout = (data.time - now) * 1000;
        console.log('timeout', timeout);

        var timer = setTimeout(function(){
            new RESTClient("http://bb3.sandbox/current/api/")
                .resource("stream_recorder")
                .identifiers(data.id)
                .update({"action" : data.job})
                .on('end',
                    function(body, error){
                        console.log(body, error);
                        self._del_from_stack(data.id, data.job);

                });
            },
            timeout
        );

        callback(data);

        data.timer = timer;

        stack.push(data);
    };
    
    this.del  = function(request, callback){
        console.log('del', arguments);
        
        var identifiers = request.getIdentifiers();

        if (identifiers === undefined){
            return callback(null, "Identifiers are missing");
        }

        this._del_from_stack(identifiers);

        callback(true);
    };

    this.update = function(request, callback){
        console.log('update', arguments);

        var identifiers = request.getIdentifiers();

        if (identifiers === undefined){
            return callback(null, "Identifiers are missing");
        }

        var data = request.getData();

        if (!data.hasOwnProperty("time")){
            return callback(null, "Job time missing");
        }

        if (!data.hasOwnProperty("job")){
            return callback(null, "Job name missing");
        }

        identifiers = identifiers[0];

        data.id = identifiers;

        var now = new Date().getTime()/1000;

        if (data.job == 'stop'){

            this._del_from_stack(identifiers, data.job);

            var self = this;
            var timeout = (data.time - now) * 1000;

            if (timeout < 0) timeout = 0;

            console.log('timeout', timeout);

            var timer = setTimeout(function(){
                new RESTClient("http://bb3.sandbox/current/api/")
                    .resource("stream_recorder")
                    .identifiers(identifiers)
                    .update({"action" : data.job})
                    .on('end',
                        function(body, error){
                            console.log(body, error);
                            self._del_from_stack(data.id, data.job);

                    });
                },
                timeout
            );
            callback(data);

            data.timer = timer;

            stack.push(data);
        }else{
            callback(null, "Wrong job");
        }
    };

    this._del_from_stack = function(id, job){

        if(isNaN(parseInt(id, 10))){
            return false;
        }

        stack = stack.filter(function(item){

            if (item.id == id && (job  == undefined || item.job == job)){

                clearTimeout(item.timer);
                return false;
            }

            return true;
        });
    };
}

function sync(){
    new RESTClient("http://bb3.sandbox/current/api/")
        .resource("stream_recorder")
        .get()
        .on('end',
            function(body, error){
                console.log(body);
                if (error){
                    console.log(error);
                }
                stack = body.results || [];

                var now = new Date().getTime()/1000;

                var recorder_task = new RESTCommandRecorderTask();

                stack = stack.filter(function(item){

                    if ((item.job == 'stop' && item.time < now) || item.job == 'start' && item.time < now){

                        new RESTClient("http://bb3.sandbox/current/api/")
                            .resource("stream_recorder")
                            .identifiers(item.id)
                            .update({"action" : item.job})
                            .on('end',
                                function(body, error){
                                    console.log(body, error);

                            });
                        return false;
                    }
                    return true
                })
        });
}

util.inherits(RESTCommandRecorderTask, RESTCommand);

module.exports.RESTCommandRecorderTask = RESTCommandRecorderTask;
module.exports.sync = sync;