// Create Game
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.GAME_TABLE; // Table for game sessions
const connectionsTableName = process.env.CONNECTIONS_TABLE; // Table for WebSocket connections
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.WEBSOCKET_ENDPOINT // Set this environment variable to your WebSocket API endpoint.
});

exports.handler = async (event) => {
    const connectionId = event.requestContext.connectionId; // Get connectionId from the WebSocket connection
    const { minNumberOfPlayers, maxNumberOfPlayers, buyIn, playerId } = JSON.parse(event.body);

    // Generate a unique gameId
    const gameId = `game_${new Date().getTime()}`;

    // Function to floor to the nearest even number
    const floorToEven = (value) => Math.floor(value / 2) * 2;
    const bigBlind = floorToEven(buyIn / 100);

    // Original newGameSession object as you provided
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
        highestBet: 0, // Keeping this as 0 as per your original variable
        deck: null, // Assuming a placeholder for a deck object
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

    try {
        // Save the new game session to DynamoDB
        await dynamoDb.put({ TableName: tableName, Item: newGameSession }).promise();

        // Update the connection item with the gameId to link this game creation to the player's WebSocket connection
        const updateParams = {
            TableName: connectionsTableName,
            Key: { connectionId },
            UpdateExpression: 'SET gameId = :gameId',
            ExpressionAttributeValues: { ':gameId': gameId },
        };
        await dynamoDb.update(updateParams).promise();

        await apiGatewayManagementApi.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify({
                message: 'Game session created successfully',
                gameId: gameId,
                gameDetails: newGameSession
            })
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ gameId, message: "Game session created successfully." }),
        };
    } catch (error) {
        console.error('Error creating game session:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to create game session." }),
        };
    }
};
