// Create Game
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.GAME_TABLE;
exports.handler = async (event) => {
    // Parse the input parameters from the event body
    const { minNumberOfPlayers, maxNumberOfPlayers, buyIn, playerId} = JSON.parse(event.body);

    // Generate a unique gameId (you can use UUIDs or any other unique identifiers)
    const gameId = `game_${new Date().getTime()}`;

    function floorToEven(value) {
        let flooredValue = Math.floor(value);
        if (flooredValue % 2 !== 0) {
            flooredValue -= 1;
        }
        return flooredValue;
    }

    const bigBlind = floorToEven(buyIn/100);

    const newGameSession = {
        gameId,
        minPlayers: minNumberOfPlayers,
        maxPlayers: maxNumberOfPlayers,
        playerCount: 1,
        pot: 0,
        communityCards: [],
        currentTurn: 0,
        gameStage: 'preDealing',
        buyIn,
        smallBlindIndex: 0,
        gameStarted: false,
        initialBigBlind: bigBlind,
        highestBet: 0,
        netWinners: [],
        gameInProgress: false,
        minRaiseAmount: bigBlind,
        bettingStarted: false,
        players: [{
            id: playerId,
            position: 0,
            chips: buyIn,
            bet: 0,
            inHand: true,
            isReady: false,
            hand: [],
            hasActed: false,
            potContribution: 0,
            isAllIn: false,
            amountWon: 0,
            handDescription: null,
            bestHand: null,
        }],
    };

    // Define the parameters to insert a new game session into DynamoDB
    const params = {
        TableName: tableName, 
        Item: newGameSession
    };

    try {
    // Use the DynamoDB document client to put the new game session item
    await dynamoDb.put(params).promise();
    return {
        statusCode: 200,
        body: JSON.stringify({ gameId, message: "Game session created successfully" })
    };
    } catch (error) {
    console.error('Error creating game session:', error);
    return {
        statusCode: 500,
        body: JSON.stringify({ message: "Failed to create game session" })
    };
    }
};