import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldBase } from '../../../clases/abstract/fieldBase';
import { IHiddenField } from '../../../clases/interfaces/IHiddenField';
import { ConfigForm } from '../../../clases/models/forms/configForm';
import { StepForm } from '../../../clases/models/forms/stepForm';
import { ParentAction } from '../../../clases/models/Parent';
import { ServicesService } from '../../../services/services.services';
import { DynamicFieldComponent } from '../dynamic-field/dynamic-field.component';
import { ConfigRequestForm } from '../../../clases/models/ConfigRequestForm';

type callback = (response: any) => void;

@Component({
    selector: 'app-dynamic-form',
    templateUrl: './dynamic-form.component.html',
    styleUrls: ['./dynamic-form.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFormComponent implements OnInit {

    /** Objeto formulario */
    form: FormGroup | any;

    /** Configuracion del formulario */
    @Input() config: ConfigForm | any;

    fields: FieldBase<any>[] = [];

    /** data a cargar en el formulario */
    @Input() data: any;


    /** Codigo del formulario */
    @Input() code: string = '';

    /**
     * Nombre de la propiedad identificadora en la data del form
     * sirve para obtener el id del registro al momento de actualizar la data
     */
    @Input() name_id: string = '';

    /** direccion para guardar y editar */
    @Input() url: string = '';

    /** Parametros adicionales */
    @Input() parametros: any = {};

    /** Salida del  componente que nofitica si un campo cambio de valor */
    @Output() ChangeField = new EventEmitter();

    @Output() ConfigLoad = new EventEmitter();

    /**
     * Salida del componente que notifica cuando el formulario es valido 
     * se ha clickeado en btn guardar
     */
    @Output() Submit = new EventEmitter();

    @Output() Success = new EventEmitter();

    loading: boolean = false;

    loading_btn_save: boolean = false;

    current = 0;


    @Input() callbackSuccess: callback = (response) => { };
    @Input() callbackError: callback = (response) => { };

    @ViewChildren(DynamicFieldComponent) dynamicFields?: QueryList<DynamicFieldComponent>;


    constructor(private services: ServicesService, private cd: ChangeDetectorRef) {
    }

    /**
     * Método que se ejecuta antes de terminar la vista
     */
    ngAfterViewInit(): void {

    }

    refreshScreen(): void {
        setTimeout(() => {
            this.cd.markForCheck();
            this.dynamicFields?.forEach((field: DynamicFieldComponent )=> {
                field.refreshScreen();
            });
        }, 10);
    }

    /**
     * Método inicial del sistema
     */
    ngOnInit() {
        if (this.code && !this.config) {
            this.getConfigFormByCode(this.code);
        } else if (this.config) {
            console.log(this.config)
            this.InicializarForm(this.data);
        }

        this.refreshScreen();
    }

    getConfigFormByCode(code: string) {
        this.loading = true;
        this.services.backendService.getBackend('api/v1/forms/code/' + code, {}, (response: any) => {
            this.loading = false;
            if (!response.error) {
                this.config = new ConfigForm();
                this.config.setConfig(response.data.json);
                // Emitimos la configuración del formulario
                this.ConfigLoad.emit({ config: this.config, data: this.data });
                this.InicializarForm(this.data);
            }
        }, (error: any) => {
            this.loading = false;
            let e = error.error;
            console.error(e.message);
        });
    }

    /**
     * Método para inicializar el formulario
     * en base a la configuracion
     */
    private InicializarForm(data = null) {
        let campos = this.getCampos();

        let campos_config_rquest = campos.filter((x: any) => x.configRequest != null && x.configRequest != undefined);

        // Si existen campos que requieren una petición HTTP
        if(campos_config_rquest.length > 0){
            this.loading = true;
            let peticionesPendientes = campos_config_rquest.length;

            campos_config_rquest.forEach((element: any) => {
                let configRequest: ConfigRequestForm = element.configRequest;
                this.services.backendService.getBackend(configRequest.url, configRequest.params, (response: any) => {
                    let options = response.data.map((x: any) => {
                        if (configRequest.name_value.includes(',')) {
                          // name_value contiene comas, tratar como multiple_name_value
                          const keys = configRequest.name_value.split(',');
                          const textParts = keys.map(key => x[key]);
                          return { key: x[configRequest.name_key], text: textParts.join(' - ') };
                        } else {
                          // name_value no contiene comas, caso normal
                          return { key: x[configRequest.name_key], text: x[configRequest.name_value] };
                        }
                      });
                    element.options = options;
                    peticionesPendientes--;
                    if (peticionesPendientes === 0)  this.createForm(campos, data);

                    //this.refreshScreen();
                }, (error: any) => {
                    let e = error.error;
                    console.error(e.message);
                    if (peticionesPendientes === 0) this.createForm(campos, data);
                });
            });
        }else{
            this.createForm(campos, data);
        }
    }

    private createForm(campos: FieldBase<any>[], data: any) {
        this.loading = false;
        this.form = this.services.fcs.toFormGroup(campos, data);
        this.refreshScreen()
    }

    /**
     * Método para obtener un listado de campos completo. Sumando todos los steps
     */
    private getCampos() {

        if(this.fields.length > 0) return this.fields;
        let fields: any = [];
        this.config.steps.forEach((element: StepForm) => {
            if (element.config_campos.length > 0) {
                element.campos = this.services.formFieldService.getCamposByConfig(element.config_campos);
            }
            fields = fields.concat(element.campos);
        });
        this.fields = fields;

        return fields;
    }

    /**
     * Método que se ejecuta al dar en el Btn guardar del formulario
     */
    onSubmit() {
        if (!this.getValidForm()) return null;
        let val = this.getValueForm();
        this.Submit.emit(val);
        if (this.url) {
            this.save(this.data ? this.name_id : null, this.url, this.parametros, val, this.callbackSuccess);
        }
        return val;
    }

    /**
     * Método para obtener el valor del formulario
     */
    private getValueForm() {
        let respuesta: any = {};
        this.config.steps.forEach((step: any) => {
            step.campos.filter((y: any) => y.hidden == false).forEach((element: any) => {
                if (this.form.controls[element.key].valid) {
                    if (element.controlType == 'file') {
                        if (this.form.controls[element.key].value instanceof File) respuesta[element.key] = this.form.controls[element.key].value;
                    } else {
                        let partes = element.key.split(".");
                        let actual = respuesta;

                        for(let i = 0; i < partes.length; i++) {
                            if(i === partes.length - 1) {
                                actual[partes[i]] = this.form.controls[element.key].value;
                            } else {
                                actual[partes[i]] = actual[partes[i]] || {};
                                actual = actual[partes[i]];
                            }
                        }
                    }
                }
            });
        });

        return respuesta;
    }

    /**
     * Método que se ejecuta cuando un cambo cambia en el formuloario
     * @param e valor emitido por el campo
     */
    changeField(e: any, dynamicField: DynamicFieldComponent) {
        this.ChangeField.emit(e);
        let val_procesado = this.services.utilidadesService.transformValueToComparate(e.fieldConfig.controlType, e.val);
        let parents: FieldBase<any>[] = this.getCampos().filter((x: any) => x.parents && x.parents.find((y: any) => y.key == e.fieldConfig.key));
        if(parents && parents.length > 0) this.notifyValueParents(e.fieldConfig, val_procesado, parents);
    }

    search(e: any, dynamicField: DynamicFieldComponent) {
        //console.log(e)
    }

    /**
     * Notifica a los campos hijos que dependen de un campo padre sobre un cambio en su valor.
     * @param configPadre El campo padre que ha cambiado de valor.
     * @param valPadre El nuevo valor del campo padre.
     * @param campos_notify Los campos hijos que deben ser notificados.
     */
    private notifyValueParents(configPadre: FieldBase<any>, valPadre: any, campos_notify: FieldBase<any>[]) {
        campos_notify.forEach(campo_hijo => {
            let parent: any = campo_hijo.parents.find((y: any) => y.key == configPadre.key);
            switch (parent.action) {
                case 'hidden':
                    let iHidden: IHiddenField = <IHiddenField>campo_hijo;
                    if (parent.rule.value == 'any') {
                        iHidden.addValueHidden(configPadre.key, true);
                        break;
                    }
                    if (this.services.utilidadesService.evaluarValores(valPadre, parent.rule.value, parent.rule.operador)) {
                        iHidden.addValueHidden(configPadre.key, true);
                    } else {
                        iHidden.addValueHidden(configPadre.key, false);
                    } 
                    break;
            }
        });
        this.refreshScreen(); 

    }

    /**
     * Método que busca la configuracion de un campo
     * en el listado de campos del formulario
     * @param key identificador del campo
     */
    private getField(key: string) {
        let res = null;
        this.config.steps.forEach((y: any) => {
            let field = y.campos.find((x: any) => x.key == key);
            if (field) {
                res = field;
                return;
            }
        })
        return res;
    }

    /**
     * Método para validar si los campos de un step, son validos
     * @param step 
     */
    getValidStep(step: StepForm) {
        let res = true
        step.campos.filter(y => y.hidden == false).forEach(element => {
            if (!this.form.controls[element.key].valid) {
                res = false;
                return;
            }
        });
        return res;
    }

    /**
     * Método para verificar si el formulario es valido,
     * teniendo en cuenta los campos ocultos
     */
    getValidForm() {
        let res_total = true;
        this.config.steps.forEach((step: any) => {
            let res = true
            step.campos.filter((y: any) => y.hidden == false).forEach((element: any) => {
                if (!this.form.controls[element.key].valid) {
                    res = false;
                    return;
                }
            });
            if (!res) {
                res_total = false;
                return;
            }
        });
        return res_total;

    }

    /**
     * Método para reiniciar el formulario
     */
    resetForm() {
        this.refreshScreen();
        this.loading = true;
        //reiniciamos el objeto form
        this.form.reset();
        //volvemos a los valores configurados
        console.log(this.config.steps)
        this.config.steps.forEach((element: any) => {
            element.campos.forEach((element: any) => {
                this.form.controls[element.key].setValue(element.value);
                let parents: FieldBase<any>[] = this.getCampos().filter((x: any) => x.parents && x.parents.find((y: any) => y.key == element.key));
                if(parents && parents.length > 0) this.notifyValueParents(element, element.value, parents);
            });
        });

        //if (this.wizard) this.wizard.reset();

        setTimeout(() => {
            this.loading = false;
            this.refreshScreen();
        }, 200);
    }

    /**
     * Método cargar data en el formulario
     * @param data 
     */
    setValueForm(data: any) {
        let data_form: any = {};
        this.config.steps.forEach((step: any) => {
            step.campos.forEach((field: any) => {
                data_form[field.key] = this.services.fcs.getValFieldToForm(field, data);
            });
        });
        this.form.patchValue(data_form);
    }

    ngOnChanges(changes: any) {
        if (changes.data) {
            if (!changes.data.firstChange) {
                this.resetForm();
                if (this.data) this.setValueForm(this.data);
            }
        }
    }


    save(name_id: any, url: string, parametros: any, data: any, callbackSuccess: any, callbackError = null, POST = false, formData = false) {
        this.loading_btn_save = true;
        if (name_id && !POST) {
            let _url = url + '/' + data[name_id];
            this.services.backendService.putBackend(_url, parametros, data, (response: any) => {
                callbackSuccess(response);
                this.services.notificacionesService.showMessage('success', response.message);
                this.loading_btn_save = false;
                this.Success.emit(response);
            }, (error: any) => {
                this.loading_btn_save = false;
                let e = error.error;
                this.services.notificacionesService.showMessage('error', e.message);
            });
        } else {
            let _url = url + (name_id ? ('/' + data[name_id]) : '');
            this.services.backendService.postBackend(_url, parametros, data, (response: any) => {
                callbackSuccess(response);
                this.loading_btn_save = false;
                this.Success.emit(response);
                this.services.notificacionesService.showMessage('success', response.message);
            }, (error: any) => {
                this.loading_btn_save = false;
                let e = error.error;
                this.services.notificacionesService.showMessage('error', e.message);
            }, formData);
        }
    }

    pre(): void {
        this.current -= 1;
    }

    next(): void {
        this.current += 1;
    }

    done(): void {
        console.log('done');
    }


    setConfig(config: ConfigForm){
        this.config =  config;
        console.log(this.config)
    }


}
