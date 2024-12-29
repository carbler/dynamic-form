import { FieldBase } from '../abstract/fieldBase';

export class TagsField extends FieldBase<string> {
    override controlType = 'tags';
    override type: string;

    constructor(options: any = {}) {
        super(options);
        this.type = options['type'] || '';
    }
}