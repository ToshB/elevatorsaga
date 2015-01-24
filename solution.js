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
                    console.log('done', floors[currentFloor].buttonStates[direction]);
                }

                // if(!floorRequests.length){
                //     elevator.goToFloor(Math.floor(Math.random(0,floors.length)*floors.length));
                // }
                (function getRequest(){
                    var request = floorRequests.shift();
                    if(request && isCurrentRequest(request)){
                        handleRequest(request)

                    }else if(floorRequests.length){
                        getRequest();
                    }else{
                        setTimeout(getRequest, 100);
                    }
                }())
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
                // When passing a floor and have room, we might want to pick up passengers
                function hasRoom(){
                    return elevator.loadFactor() < 0.5;
                }
                function isBottomFreebie(){
                    return floorNum === 1 && direction === 'down' && floors[floorNum].buttonStates.down === 'activated';
                }
                function isTopFreebie(){
                    return floorNum === floors.length-2 && direction === 'up' && floors[floorNum].buttonStates.up === 'activated';
                }
                if(hasRoom() && (isBottomFreebie() || isTopFreebie())){
                    elevator.destinationQueue.unshift(floorNum);
                    elevator.checkDestinationQueue();
                }
            });

            elevator.on("floor_button_pressed", function(floorNum){
                var currentFloor = elevator.currentFloor(),
                queue = elevator.destinationQueue;
                var movingUp = currentFloor < floorNum;
                if(!elevator.destinationQueue.some(function(f){return f === floorNum;})){
                    elevator.destinationQueue.push(floorNum);
                    elevator.destinationQueue.sort(function(a,b){
                        return movingUp ? a > b : a < b;
                    });
                }
                setIndicators(movingUp ? 'up' : 'down');
                elevator.checkDestinationQueue();
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
                floorRequests.push(floorNum + desiredDirection);
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
