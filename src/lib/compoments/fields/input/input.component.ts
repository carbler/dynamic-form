import {  Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.sass'],
  providers: [
    {
        provide: NG_VALUE_ACCESSOR,
        multi: true,
        useExisting: forwardRef(() => InputComponent),
    }
]
})
export class InputComponent implements OnInit {

    /** Modelo de datos -> contiene el valor del campo */
    valueModel: any;

    /** Determina si se habilita o desabilita el campo */
    @Input() disabled = false;

    /** Nombre del campo en el formulario */
    @Input() formControlName: string | undefined; 

    /** Máximo tamaño permitido */
    @Input() maxlength: any;    

    /** Texto de ayuda que va dentro del inpur */
    @Input() placeholder: any;   
    
    /** Tipo de caja de texto 'text' 'number' */
    @Input() type: string | undefined;        

    /** Salida del componente que indica cuando cambia el campo */
    @Output() changeDate = new EventEmitter();

    selectionStart = 0;

    selectionEnd = 0;

    constructor() { }

    ngOnInit(): void {  }

    propagateChange = (_: any) => { };

    /** Método que recibe un campo en el valor del campo */
    writeValue(obj: any): void {
        this.valueModel = obj;
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    ngAfterViewChecked(): void {
        this.propagateChange(this.valueModel);    }

    ngAfterViewInit(): void {
    }
   
    changueField(event:any) {
        this.propagateChange(event);
        this.changeDate.emit(event);
    }

    focusFunction(e:any){
        setTimeout(() => {
            this.selectionStart = e.target.selectionStart;
            this.selectionEnd = e.target.selectionEnd;
        }, 10);
        
    }
    
    focusOutFunction(e:any){
        setTimeout(() => {
            this.selectionStart = e.target.selectionStart;
            this.selectionEnd = e.target.selectionEnd;
        }, 10);
    }
}
