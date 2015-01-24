{
    init: function(elevators, floors) {
        var floorRequests = [];

        function registerElevatorCallbacks(elevator, elevatorIndex){
            function checkRequests(){
                function isCurrentRequest(request){
                    var floorNum = parseInt(request[0], 10),
                    direction = request.slice(1,5);
                    return floors[floorNum].buttonStates[direction] === 'activated';
                }

                function handleRequest(request){
                    var currentFloor = elevator.currentFloor();
                    var floorNum = parseInt(request[0], 10),
                    direction = request.slice(1,5);
                    elevator.destinationQueue.push(floorNum);
                    elevator.checkDestinationQueue();
                    return floors[currentFloor].buttonStates[direction] !== 'activated';
                }

                var request = floorRequests[0];
                if(!request){
                    setTimeout(checkRequests, 100);
                    return;
                }

                if(!isCurrentRequest(request)){
                    floorRequests.shift();
                    setTimeout(checkRequests, 0);
                    return;
                }

                if(handleRequest(request)){
                    floorRequests.shift();
                }
            }

            function setIndicators(direction){
                elevator.goingUpIndicator(direction === 'up');
                elevator.goingDownIndicator(direction === 'down');
            }

            elevator.on('stopped_at_floor', function (floorNum){
                var queue = elevator.destinationQueue,
                floor = floors[floorNum];

                if(!queue.length){
                    if(floor.buttonStates.up === 'activated'){
                        setIndicators('up');
                    }else if(floor.buttonStates.down === 'activated'){
                        setIndicators('down');
                    }else{
                        setIndicators();
                    }
                }
            });

            elevator.on('passing_floor', function(floorNum, direction){
            });

            elevator.on("floor_button_pressed", function(floorNum){
                var currentFloor = elevator.currentFloor(),
                queue = elevator.destinationQueue,
                movingUp = currentFloor < floorNum;

                if(!~elevator.destinationQueue.indexOf(floorNum)){
                    elevator.destinationQueue.push(floorNum);
                    elevator.destinationQueue.sort(function(a,b){
                        return movingUp ? a > b : a < b;
                    });
                    elevator.checkDestinationQueue();
                }

                setIndicators(movingUp ? 'up' : 'down');
            });

            elevator.on("idle", function() {
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
                floorRequests.push(request);
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
