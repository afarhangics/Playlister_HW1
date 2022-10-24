import jsTPS_Transaction from "../../common/jsTPS.js"
/**
 * RemoveSong_Transaction
 * 
 * This class represents a transaction that works with removing a song.
 * It will be managed by the transaction stack.
 * 
 * @author Alireza Farhangi
 */
export default class RemoveSong_Transaction extends jsTPS_Transaction {
    constructor(initModel, initOldPayload) {
        super();
        this.model = initModel;
        this.oldPayload = initOldPayload;
    }

    doTransaction(){
        this.model.removeSong("do", this.oldPayload);
    }
    
    undoTransaction(){
        this.model.removeSong("undo", this.oldPayload);
    }
}