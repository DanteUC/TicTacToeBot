const Discord = require('discord.js');
const config = require("./config.json");
//const { prefix,token } = require('./config.json');
const client= new  Discord.Client();

//const prefix = '~';

client.once('ready', () => {
    console.log('online');
});

let space = ':black_medium_small_square:'
//map to allow multiple games to occur at the same time
let playerMap = new Map();

//ai will be o and players will be x because everyone prefers to play as x
const AI=':o:';
const player=':x:';
const turn=player;// gonna start off with the player having the first turn
// class to manage a game for each user in a server
function printBoard(keyVal){//sends the current board as a message 
    let access= playerMap.get(keyVal);
    let outputString=
    `${access[0][0]}|${access[0][1]}|${access[0][2]}
------------
${access[1][0]}|${access[1][1]}|${access[1][2]}
------------
${access[2][0]}|${access[2][1]}|${access[2][2]}`;
    return outputString;
}
function equals3(a, b, c) {
    return a == b && b == c && a !=space;
}
function isWinner(board) {
    let winner = null;
  
    // horizontal
    for (let i = 0; i < 3; i++) {
      if (equals3(board[i][0], board[i][1], board[i][2])) {
        winner = board[i][0];
      }
    }
  
    // Vertical
    for (let i = 0; i < 3; i++) {
      if (equals3(board[0][i], board[1][i], board[2][i])) {
        winner = board[0][i];
      }
    }
  
    // Diagonal
    if (equals3(board[0][0], board[1][1], board[2][2])) {
      winner = board[0][0];
    }
    if (equals3(board[2][0], board[1][1], board[0][2])) {
      winner = board[2][0];
    }
  
    let openSpots = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] == space) {
          openSpots++;
        }
      }
    }
  
    if (winner == null && openSpots == 0) {
      return 0;
    } else if(winner == AI){
      return 1;
    }else if(winner == player){
        return -1
    }else{
        return null;
    }
  }
  
function minimax(board,depth, isMaximizing){
    let result = isWinner(board);
    if (result !== null) {
        return result;
    }
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            // Is the spot available?
            if (board[i][j] == space) {
              board[i][j] = AI;
              let score = minimax(board, depth + 1, false);
              board[i][j] = space;
              bestScore = Math.max(score, bestScore);
            }
          }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            // Is the spot available?
            if (board[i][j] == space) {
              board[i][j] = player;
              let score = minimax(board, depth + 1, true);
              board[i][j] = space;
              bestScore = Math.min(score, bestScore);
            }
          }
        }
        return bestScore;
    }
}

//call recursive minimax algo to determine the ideal move and then updates the board with the ai move
function makeMove(keyVal){
    let bestScore= -Infinity;
    let bestCol;
    let bestRow;
    let userBoard= playerMap.get(keyVal);
    for (let i=0; i<3;i++){
        for(let j=0; j<3;j++){
            if (userBoard[i][j]==space){// space available
                userBoard[i][j]=AI;//set space to ai player 
                let score = minimax(userBoard,0,false);//minimax algo
                userBoard[i][j]=space;// we want to undo the "test" move
                if (score>bestScore){// update the best move each time we look at a new move
                    bestScore= score;
                    bestCol=i;
                    bestRow=j;
                }
            }
        }
        
    }
    userBoard[bestCol][bestRow]=AI; //make move
}


client.on('message', message => {
    if(!message.content.startsWith(config.prefix)|| message.author.bot)return;

    const args = message.content.slice(config.prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    let keyVal = message.author.toString();
    if(command === 'help'){// uhhhh print a help table eventually 
        message.channel.send('the board is set up in the following configuration: \n123\n456\n789');
        message.channel.send('commands:\n'+config.token+'play: start a new game\n'+config.token+'display: display your current board\n'+config.token+'#(0-9): make a move on the specified spot');
    }else if (command === 'play'){// set up a new player and board in the map
        let board=[[space,space,space],[space,space,space],[space,space,space]];//3x3 array
        playerMap.set(keyVal, board);
        message.channel.send(printBoard(keyVal));
    }else if (command === 'display'&&playerMap.has(keyVal)){
        message.channel.send(printBoard(keyVal));
    }else if (command === '1' && playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[0][0]==space){
            accessBoard[0][0]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
            skip=true;
        }
        message.channel.send(printBoard(user));
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                    skip=true;
                }
            }
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
    }else if (command === '2'&& playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[0][1]==space){
            accessBoard[0][1]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
            skip=true;
        }
        message.channel.send(printBoard(user));
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
        skip=false;
    }else if (command === '3'&& playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[0][2]==space){
            accessBoard[0][2]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
            skip=true;
        }
        message.channel.send(printBoard(user));
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
        skip=false;
    }else if (command === '4'&& playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[1][0]==space){
            accessBoard[1][0]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
            skip=true;
        }
        message.channel.send(printBoard(user));
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
        skip=false;
    }else if (command === '5'&& playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[1][1]==space){
            accessBoard[1][1]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
            skip=true;
        }
        message.channel.send(printBoard(user));
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
        skip=false;
    }else if (command === '6'&& playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[1][2]==space){
            accessBoard[1][2]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
            skip=true;
        }
        message.channel.send(printBoard(user));
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
        skip=false;
    }else if (command === '7'&& playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[2][0]==space){
            accessBoard[2][0]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
            skip=true;
        }
        message.channel.send(printBoard(user));
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
        skip=false;
    }else if (command === '8'&& playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[2][1]==space){
            accessBoard[2][1]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
            skip=true;
        }
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
        skip=false;
    }else if (command === '9'&& playerMap.has(keyVal)){
        let skip = false;
        let user=message.author.toString();
        message.channel.send(user+'\'s turn');
        accessBoard=playerMap.get(user);
        if(accessBoard[2][2]==space){
            accessBoard[2][2]=player;
        }else{
            message.channel.send('Invalid move! Select a space that has not yet been filled');
        }
        message.channel.send(printBoard(user));
        if(isWinner(accessBoard)==-1){
            message.channel.send('You win!');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }else if(isWinner(accessBoard)==0){
            message.channel.send('Tie Game');
            for(let i=0;i<3;i++){
                for(let j=0;j<3;j++){
                    accessBoard[i][j]=space;
                }
            }
            skip=true;
        }
        if(skip==false){
            makeMove(user);
            message.channel.send("AI turn");
            message.channel.send(printBoard(user));
            if(isWinner(accessBoard)==1){
                message.channel.send('You lose');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }else if(isWinner(accessBoard)==0){
                message.channel.send('Tie Game');
                for(let i=0;i<3;i++){
                    for(let j=0;j<3;j++){
                        accessBoard[i][j]=space;
                    }
                }
            }
        }
        skip=false;
    }
});

client.login(config.token);