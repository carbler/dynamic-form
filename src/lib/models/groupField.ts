import { FieldBase } from '../abstract/fieldBase';

export class GroupField extends FieldBase<string> {
    override controlType = 'group';
    override type: string;
    config: [];

    constructor(options: any = {}) {
        super(options);
        this.type = options['type'] || '';
        this.config = options['config'] || '';

    }
}