export const template =`<div>
                                <span class="clsBtn" @click="close">X</span>
                                <span>Tag</span>
                                <div @showIf="!displayRowForm">
                                    <select @model="selectedTag">
                                        <option km:foreach="item in rowTags" renderer="_handleOption">
                                        Patrov {item} options!
                                        </option>
                                    </select>
                                    <span class="addRowCls" @click="showRowForm">[+]</span>
                                </div>
                                <div class="row-edition">
                                    <span>Tag</span>
                                    <div @showIf="displayRowForm">
                                        <span km:model="newRowName" style="display: inline-block; width: 100px; border: 1px solid gray" class="" contenteditable></span>
                                        <span class="addRowCls" @click="createNewRow">[+]</span>
                                    </div>
                                </div>
                        </div>`

                        