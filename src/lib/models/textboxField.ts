import { FieldBase } from '../abstract/fieldBase';

export class TextboxField extends FieldBase<string> {
    
    override controlType = 'textbox';
    override type: string;
    minLength: number;
    maxLength: number;

    constructor(options: any = {}) {
        super(options);
        this.type = options['type'] || '';
        this.minLength = options['minLength'] || undefined;
        this.maxLength = options['maxLength'] || undefined;
    }
}