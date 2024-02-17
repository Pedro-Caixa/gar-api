const axios = require("axios");
const fs = require('fs');
const cron = require('node-cron');

const cacheFilePath = './gar-information/blacklist_trello.json';

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
  } catch (error) {
    console.error('Error reading cache:', error);

    if (!fs.existsSync(cacheFilePath)) {
      console.log('Cache file not found, creating a new one.');
      writeCache({ timestamp: 0, boards: [], cards: [] });
    }
    return null;
  }
}

function writeCache(data) {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

export async function updateCache() {
  try {
    console.log('Updating cache from Trello...');
    const response = await axios.get(
      'https://trello.com/b/V32ipe8n/gar-blacklist-board.json'
    );
    const boards = response.data.lists;
    const cards = response.data.cards;
    writeCache({ timestamp: Date.now(), boards, cards });
    console.log('Cache updated successfully!');
  } catch (error) {
    console.error('Error updating cache:', error);
  }
}


export async function getCardsInList(listName) {
  const cachedData = readCache();

  if (cachedData && cachedData.timestamp > Date.now() - 3600000) {

    const boards = cachedData.boards;
    console.log('Using cache data:', listName);

    for (let i = 0; i < boards.length; i++) {
      const currentList = boards[i];
      if (currentList.name === listName) {
        const relevantCards = cachedData.cards.filter(
          (card) => card.idList === currentList.id
        );

        if (relevantCards.length > 0) {
          relevantCards.forEach((card) => console.log(`- ${card.name}`));
        } else {
          console.log('No card was found on this list.');
        }

        break;
      }
    }
  } else {
    console.log('Searching trello data for: ', listName);

    try {
      const response = await axios.get(
        'https://trello.com/b/V32ipe8n/gar-blacklist-board.json'
      );
      const boards = response.data.lists;
      const cards = response.data.cards;

      for (let i = 0; i < boards.length; i++) {
        const currentList = boards[i];
        if (currentList.name === listName) {
          const relevantCards = cards.filter(
            (card) => card.idList === currentList.id
          );

          if (relevantCards.length > 0) {
            console.log('Cartões na lista:');
            relevantCards.forEach((card) => console.log(`- ${card.name}`));
          } else {
            console.log('No card was found on this list.');
          }

          break;
        }
      }

      writeCache({ timestamp: Date.now(), boards, cards });
    } catch (error) {
      console.error('Error while searching for trello: ', error);
    }
  }
}

export async function getCard(card_name) {
  const cachedData = readCache();

  if (cachedData && cachedData.timestamp > Date.now() - 3600000) {
    // Usar dados do cache
    const cards = cachedData.cards;
    console.log('Using cache info:', card_name);

    for (let i = 0; i < cards.length; i++) {
      const currentCard = cards[i];
      if (currentCard.name === card_name) {
        const listName = cachedData.boards.find(
          (list) => list.id === currentCard.idList
        )?.name;
        return { card: currentCard, listName };
      }
    }
  } else {

    console.log('Searching trello data for the card', card_name);

    try {
      const response = await axios.get(
        'https://trello.com/b/V32ipe8n/gar-blacklist-board.json'
      );
      const cards = response.data.cards;
      const boards = response.data.lists;

      for (let i = 0; i < cards.length; i++) {
        const currentCard = cards[i];
        if (currentCard.name === card_name) {
          const listName = boards.find(
            (list) => list.id === currentCard.idList
          )?.name;
          return { card: currentCard, listName };
        }
      }

      writeCache({ timestamp: Date.now(), boards, cards });
    } catch (error) {
      console.error('Error to get data in the trello:', error);
      return null; 
    }
  }

  return null; 
}