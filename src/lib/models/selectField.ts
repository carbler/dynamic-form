import { FieldBase } from '../abstract/fieldBase';
import { ConfigRequestForm } from '../models/ConfigRequestForm';

export class SelectField extends FieldBase<string> {
    override controlType = 'select';
    options: { key: string, text: string }[] = [];
    multiple: boolean;
    dropdownList = [];
    //selectedItems = [];
    dropdownSettings = {};
    key_field: string;
    text_field: string;

    configRequest: ConfigRequestForm;
    
    constructor(options: any = {}) {
        super(options);
        this.options = options['options'] || [];
        this.key_field = options['key_field'] || 'id';
        this.text_field = options['text_field'] || 'text';
        this.multiple = options['multiple'];
        this.configRequest = options['configRequest'];

    }
}