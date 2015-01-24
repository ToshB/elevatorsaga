{
    init: function(elevators, floors) {
        var floorRequests = [];

        function registerElevatorCallbacks(elevator, elevatorIndex){
            function checkRequests(){
                console.log('elevator %i checking requests', elevatorIndex, floorRequests);
                function isCurrentRequest(request){
                    var floorNum = parseInt(request[0], 10),
                    direction = request.slice(1,5);
                    return floors[floorNum].buttonStates[direction] === 'activated';
                }
                function handleRequest(request){
                    var floorNum = parseInt(request[0], 10),
                    direction = request.slice(1,5);
                    console.log('elevator %i moving to floor %i', elevatorIndex, floorNum);
                    elevator.destinationQueue.push(floorNum);

                    // placeholder
                    elevator.destinationQueue.push(direction);
                    elevator.checkDestinationQueue();
                }


                (function getRequest(){
                    var request = floorRequests.shift();
                    if(request && isCurrentRequest(request)){
                        handleRequest(request);
                    }else if(floorRequests.length){
                        getRequest();
                    }else{
                        setTimeout(getRequest, 100);
                    }
                }())
            }

            function indicateUp(){
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);
            }
            function indicateDown(){
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(true);
            }
            function indicateOff(){
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(false);
            }

            elevator.on('stopped_at_floor', function (floorNum){
                var queue = elevator.destinationQueue,
                floor = floors[floorNum];
                console.log('elevator %i arrived on floor %i, queue: ', elevatorIndex, floorNum, queue);
                if(/up|down/.test(queue[0])){
                    if(floor.buttonStates.up !== 'activated' && floor.buttonStates.down !== 'activated'){
                        indicateOff();
                        queue.shift();
                    }else if(queue[0] === 'up'){
                        indicateUp();
                    }else if(queue[0] === 'down'){
                        indicateDown();
                    }
                }

                if(!queue.length){
                    if(floor.buttonStates.up === 'activated'){
                        indicateUp();
                    }else if(floor.buttonStates.down === 'activated'){
                        indicateDown();
                    }else{
                        indicateOff();
                    }
                }

            });
            elevator.on('passing_floor', function(floorNum, direction){
                function isBottomFreebie(){
                    return floorNum === 1 && direction === 'down' && floors[floorNum].buttonStates.down === 'activated';
                }
                function isTopFreebie(){
                    return floorNum === floors.length-2 && direction === 'up' && floors[floorNum].buttonStates.up === 'activated';
                }
                if(isBottomFreebie() || isTopFreebie()){
                    console.log('freebie!');
                    elevator.destinationQueue.unshift(floorNum);
                    elevator.checkDestinationQueue();
                }
            });

            elevator.on("floor_button_pressed", function(floorNum){
                var currentFloor = elevator.currentFloor(),
                queue = elevator.destinationQueue;
                if(/up|down/.test(queue[0])){
                    queue.shift();
                }
                var movingUp = currentFloor < floorNum;
                if(!elevator.destinationQueue.some(function(f){return f === floorNum;})){
                    elevator.destinationQueue.push(floorNum);
                    elevator.destinationQueue.sort(function(a,b){
                        return movingUp ? a > b : a < b;
                    });
                }
                elevator.goingUpIndicator(movingUp);
                elevator.goingDownIndicator(!movingUp);

                console.log('requesting elevator %i move', elevatorIndex, movingUp ? 'up' : 'down', 'to', floorNum, queue);
                elevator.checkDestinationQueue();
            });

            elevator.on("idle", function() {
                console.log('elevator %i idle', elevatorIndex);
                checkRequests(elevator);
            });

        }

        function callElevator(floorNum, desiredDirection){
            function requestExists(req){
                return !!~floorRequests.indexOf(req);
            }

            function isBeingServed(){
                return elevators.some(function(e){
                    return e.destinationQueue.length === 1 && e.destinationQueue[0] === floorNum;
                });
            }

            var request = floorNum+desiredDirection;
            if(!requestExists(request) && !isBeingServed()){
                floorRequests.push(floorNum + desiredDirection);
                console.log('requested service:', floorRequests);
            }
        }
        function registerFloorButtons(floor){
            floor.on('up_button_pressed', callElevator.bind(null, floor.level, 'up'));
            floor.on('down_button_pressed', callElevator.bind(null, floor.level, 'down'));
        }

        floors.forEach(registerFloorButtons);
        elevators.forEach(registerElevatorCallbacks);
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
