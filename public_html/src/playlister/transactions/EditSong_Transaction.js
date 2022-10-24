import jsTPS_Transaction from "../../common/jsTPS.js"
/**
 * EditSong_Transaction
 * 
 * This class represents a transaction that works with editting a song.
 * It will be managed by the transaction stack.
 * 
 * @author Alireza Farhangi
 */
export default class EditSong_Transaction extends jsTPS_Transaction {
    constructor(initModel, initOldPayload, initNewPayload) {
        super();
        this.model = initModel;
        this.oldPayload = initOldPayload;
        this.newPayload = initNewPayload;
    }

    doTransaction() {
        this.model.editSong("do", this.oldPayload, this.newPayload);
    }
    
    undoTransaction() {
        this.model.editSong("undo", this.oldPayload, this.newPayload);
    }
}