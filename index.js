// Create Game
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.GAME_TABLE;
exports.handler = async (event) => {
    // Parse the input parameters from the event body
    const { minNumberOfPlayers, maxNumberOfPlayers, buyIn } = JSON.parse(event.body);

    // Generate a unique gameId (you can use UUIDs or any other unique identifiers)
    const gameId = `game_${new Date().getTime()}`;

    const newGameSession = {
        gameId,
        minPlayers: minNumberOfPlayers,
        maxPlayers: maxNumberOfPlayers,
        buyIn,
        players: [], // Initialize with an empty player list
        gameStarted: false
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