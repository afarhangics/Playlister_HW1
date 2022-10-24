import jsTPS_Transaction from "../../common/jsTPS.js"
/**
 * AddNewSong_Transaction
 * 
 * This class represents a transaction that works with adding a new song.
 * It will be managed by the transaction stack.
 * 
 * @author Alireza Farhangi
 */
export default class AddNewSong_Transaction extends jsTPS_Transaction {
    constructor(initModel) {
        super();
        this.model = initModel;
    }

    doTransaction() {
        this.model.addNewSong("do");
    }
    
    undoTransaction() {
        this.model.addNewSong("undo");
    }
}