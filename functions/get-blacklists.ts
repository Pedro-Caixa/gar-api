const axios = require("axios");

export async function getCardsInList(listName) {
    const response = await axios.get("https://trello.com/b/V32ipe8n/gar-blacklist-board.json");
    const boards = response.data.lists;

    for (let i = 0; i < 17; i++) {
        const currentList = boards[i];
        if (currentList.name === listName) {
          console.log(`List "${listName}" was found in the position ${i}:`);
  
          const relevantCards = response.data.cards.filter(
            (card) => card.idList === currentList.id
          );
  
          if (relevantCards.length > 0) {
            console.log("Cards in the list:");
            relevantCards.forEach((card) => console.log(`- ${card.name}`));
          } else {
            console.log("No cards found in this list.");
          }
  
          break; 
        }
      }
    } 

export async function getCard(card_name) {
    const response = await axios.get("https://trello.com/b/V32ipe8n/gar-blacklist-board.json");
    const cards = response.data.cards;
    const boards = response.data.lists;

        for (let i = 0; i < cards.length; i++) {
            const currentCard = cards[i];
            
            if (currentCard.name === card_name) {
                const listName = boards.find((list) => list.id === currentCard.idList)?.name;
                return { card: currentCard, listName };
              }
    }
    return null;
}

