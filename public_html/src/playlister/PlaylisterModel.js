import jsTPS from "../common/jsTPS.js";
import Playlist from "./Playlist.js";
import MoveSong_Transaction from "./transactions/MoveSong_Transaction.js";
import AddNewSong_Transaction from "./transactions/AddNewSong_Transaction.js";
import EditSong_Transaction from "./transactions/EditSong_Transaction.js";
import RemoveSong_Transaction from "./transactions/RemoveSong_Transaction.js";

/**
 * PlaylisterModel.js
 * 
 * This class manages all playlist data for updating and accessing songs
 * as well as for loading and unloading lists. Note that editing should employ
 * an undo/redo mechanism for any editing features that change a loaded list
 * should employ transactions the jsTPS.
 * 
 * Note that we are employing a Model-View-Controller (MVC) design strategy
 * here so that when data in this class changes it is immediately reflected
 * inside the view of the page.
 * 
 * @author McKilla Gorilla
 * @author Alireza Farhangi
 */
export default class PlaylisterModel {
    /*
        constructor

        Initializes all data for this application.
    */
    constructor() {
        // THIS WILL STORE ALL OF OUR LISTS
        this.playlists = [];

        // THIS IS THE LIST CURRENTLY BEING EDITED
        this.currentList = null;

        //SAVES CURRENT INDEX
        this.currentindex = 0;

        //EDIT SONG INDEX
        this.songIndex =  null

        // THIS WILL MANAGE OUR TRANSACTIONS
        this.tps = new jsTPS();

        // WE'LL USE THIS TO ASSIGN ID NUMBERS TO EVERY LIST
        this.nextListId = 0;

        // THE MODAL IS NOT CURRENTLY OPEN
        this.confirmDialogOpen = false;
    }

    // FOR MVC STUFF
    
    setView(initView) {
        this.view = initView;
    }

    refreshToolbar() {
        this.view.updateToolbarButtons(this);
    }

    getList(index) {
        return this.playlists[index];
    }

    editSong(actionType, oldPayload, newPayload){
        if (this.hasCurrentList()){
            if(actionType === "do")
                this.playlists[this.currentindex].songs[this.songIndex] = newPayload;
            else if(actionType === "undo")
                this.playlists[this.currentindex].songs[this.songIndex] = oldPayload;
            this.view.refreshPlaylist(this.playlists[this.currentindex]);
            this.saveLists();
        }
    }
    
    removeSong(actionType, oldPayload){
        if (this.hasCurrentList()){
            let currentPlaylist = this.playlists[this.currentindex];
            if(actionType === "do")
                currentPlaylist.songs.splice(this.songIndex, 1);
            else if(actionType === "undo")
            {
                const songs = [...currentPlaylist.songs];
                const leftHandSide = songs.slice(0, this.songIndex + 1);
                const rightHandSide = songs.slice(this.songIndex + 1);
                currentPlaylist.songs = [
                    ...leftHandSide,
                    oldPayload,
                    ...rightHandSide
                ];
            }
            this.playlists[this.currentindex] = currentPlaylist;
            this.view.refreshPlaylist(currentPlaylist);
            this.saveLists();
        }
    }

    addNewSong(actionType){
        if (this.hasCurrentList()) {
            const newSong = {
                youTubeId: "dQw4w9WgXcQ",
                title: "Untitled",
                artist: "Unknown"
              };
            let currentPlaylist = this.playlists[this.currentindex];
            if(actionType === "do")
              currentPlaylist.songs.push(newSong);
            else if(actionType === "undo")
              currentPlaylist.songs.splice((currentPlaylist.songs.length - 1), 1);
            this.playlists[this.currentindex] = currentPlaylist;
            this.view.refreshPlaylist(currentPlaylist);
            this.saveLists();
        }
    }

    getListIndex(id) {
        for (let i = 0; i < this.playlists.length; i++) {
            let list = this.playlists[i];
            if (list.id === id) {
                return i;
            }
        }
        return -1;
    }

    getPlaylistSize() {
        return this.currentList.songs.length;
    }

    getCurrentIndex()
    {
        return this.currentindex;
    }

    getCurrentSong(){
        return this.currentList.songs[this.songIndex];
    }

    getSongIndex() {
        return this.songIndex;
    }

    setSongIndex(index) {
        this.songIndex = index;
    }

    getSong(index) {
        return this.currentList.songs[index];
    }

    getDeleteListId() {
        return this.deleteListId;
    }

    setDeleteListId(initId) {
        this.deleteListId = initId;
    }

    toggleConfirmDialogOpen() {
        this.confirmDialogOpen = !this.confirmDialogOpen;
        this.view.updateToolbarButtons(this);
        return this.confirmDialogOpen;
    }

    // THESE ARE THE FUNCTIONS FOR MANAGING ALL THE LISTS

    addNewList(initName, initSongs) {
        let newList = new Playlist(this.nextListId++);
        if (initName)
            newList.setName(initName);
        if (initSongs)
            newList.setSongs(initSongs);
        this.playlists.push(newList);
        this.sortLists();
        this.view.refreshLists(this.playlists);
        return newList;
    }

    sortLists() {
        this.playlists.sort((listA, listB) => {
            if (listA.getName().toUpperCase() < listB.getName().toUpperCase()) {
                return -1;
            }
            else if (listA.getName().toUpperCase() === listB.getName().toUpperCase()) {
                return 0;
            }
            else {
                return 1;
            }
        });
        this.view.refreshLists(this.playlists);
    }

    hasCurrentList() {
        return this.currentList !== null;
    }

    unselectAll() {
        for (let i = 0; i < this.playlists.length; i++) {
            let list = this.playlists[i];
            this.view.unhighlightList(list.id); // Was : this.view.unhighlightList(i);
        }
    }

    loadList(id) {
        // If user attempts to reload the currentList, then do nothing.
        if (this.hasCurrentList() && id === this.currentList.id) {
            this.view.highlightList(id);
            return;
        }

        let list = null;
        let found = false;
        let i = 0;
        while ((i < this.playlists.length) && !found) {
            list = this.playlists[i];
            if (list.id === id) {
                // THIS IS THE LIST TO LOAD
                this.currentList = list;
                this.currentindex = i;
                this.view.refreshPlaylist(this.currentList);
                this.view.highlightList(id); // Was : this.view.highlightList(i);
                found = true;
            }
            i++;
        }
        this.tps.clearAllTransactions();
        this.view.updateStatusBar(this);
        //this.view.updateToolbarButtons(this);
    }

    loadLists() {
        // CHECK TO SEE IF THERE IS DATA IN LOCAL STORAGE FOR THIS APP
        let recentLists = localStorage.getItem("recent_work");
        if (!recentLists) {
            return false;
        }
        else {
            let listsJSON = JSON.parse(recentLists);
            this.playlists = [];
            for (let i = 0; i < listsJSON.length; i++) {
                let listData = listsJSON[i];
                let songs = [];
                for (let j = 0; j < listData.songs.length; j++) {
                    songs[j] = listData.songs[j];
                }
                this.addNewList(listData.name, songs);
            }
            this.sortLists();   
            this.view.refreshLists(this.playlists);
            return true;
        }        
    }

    saveLists() {
        let playlistsString = JSON.stringify(this.playlists);
        localStorage.setItem("recent_work", playlistsString);
    }

    restoreList() {
        this.view.update(this.currentList);
    }

    unselectCurrentList() {
        if (this.hasCurrentList()) {
            this.currentList = null;
            this.view.updateStatusBar(this);
            this.view.clearWorkspace();
            this.tps.clearAllTransactions();
            this.view.updateToolbarButtons(this);
        }
    }

    renameCurrentList(initName, id) {
        const listIndex = this.getListIndex(id);
        if (this.hasCurrentList()) {

            if (initName === "") {
                this.playlists[listIndex].setName("Untitled");
            } else {
                this.playlists[listIndex].setName(initName);
            }
            
            this.sortLists();
            this.playlists.forEach((pl, index) => {
                if(pl.getName() === initName){
                    this.currentList = pl;
                    this.currentindex = index; 
                }              
            });
            this.view.highlightList(id);
            this.saveLists();
            this.view.updateStatusBar(this);
        }
    }



    deleteList(id) {
        let toBeDeleted = this.playlists[this.getListIndex(id)];
        this.playlists = this.playlists.filter(list => list.id !== id);
        this.view.refreshLists(this.playlists)
        // 2 cases, deleted is current list
        // deleted is not current list
        if (toBeDeleted == this.currentList) {
            this.currentList = null;
            this.view.clearWorkspace();
            this.tps.clearAllTransactions();
            this.view.updateStatusBar(this);
        } else if (this.hasCurrentList()) {
            this.view.highlightList(this.currentList.id);
        }
        this.saveLists();
    }

    // NEXT WE HAVE THE FUNCTIONS THAT ACTUALLY UPDATE THE LOADED LIST

    moveSong(fromIndex, toIndex) {
        if (this.hasCurrentList()) {
            let tempArray = this.currentList.songs.filter((song, index) => index !== fromIndex);
            tempArray.splice(toIndex, 0, this.currentList.getSongAt(fromIndex))
            this.currentList.songs = tempArray;
            this.view.refreshPlaylist(this.currentList);
        }
        this.saveLists();
    }

    // SIMPLE UNDO/REDO FUNCTIONS, NOTE THESE USE TRANSACTIONS
    undo() {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();
            this.view.updateToolbarButtons(this);
        }
    }

    redo() {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();
            this.view.updateToolbarButtons(this);
        }
    }

    // NOW THE FUNCTIONS THAT CREATE AND ADD TRANSACTIONS
    // TO THE TRANSACTION STACK
    addMoveSongTransaction(fromIndex, onIndex) {
        let transaction = new MoveSong_Transaction(this, fromIndex, onIndex);
        this.tps.addTransaction(transaction);
        this.view.updateToolbarButtons(this);
    }

    //FUNCTION THAT CREATES AND ADDS NEWSONG TRANSACTION
    // TO THE TRANSACTION STACK
    addNewSongTransaction() {
        const transaction = new AddNewSong_Transaction(this);
        this.addTransaction(transaction);
    }

    // FUNCTION THAT CREATES AND ADDS EDITSONG TRANSACTION
    // TO THE TRANSACTION STACK
    editSongTransaction(oldPayload, newPayload) {
        const transaction = new EditSong_Transaction(this, oldPayload, newPayload);
        this.addTransaction(transaction);
    }

    // FUNCTION THAT CREATES AND REMOVES SONG TRANSACTION
    // TO THE TRANSACTION STACK
    removeSongTransaction(oldPayload) {
        const transaction = new RemoveSong_Transaction(this, oldPayload);
        this.addTransaction(transaction);
    }

    //UTILITY FUNCTION TO ADD TRANSACTION TO TPS
    addTransaction(transaction){
        this.tps.addTransaction(transaction);
        this.view.updateToolbarButtons(this);
    }
}