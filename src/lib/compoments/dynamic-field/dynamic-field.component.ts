import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import setHours from 'date-fns/setHours';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzUploadXHRArgs } from 'ng-zorro-antd/upload';

import { ServicesService } from '../../../services/services.services';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dynamic-field',
  templateUrl: './dynamic-field.component.html',
  styleUrls: ['./dynamic-field.component.sass'],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFieldComponent implements OnInit {
  /** Campo */
  @Input() field: any;

  /** Formulario al que pertenece */
  @Input() form: FormGroup | any;

  /** Salida del componente que notifica el cambio de valor del campo */
  @Output() ChangeField = new EventEmitter();

  @Output() Search = new EventEmitter();

  timeDefaultValue = setHours(new Date(), 0);

  private timeout: any;

  /** url vista previa file imagen */
  imgPrevURL: any = null;

  private url_no_imagen = 'assets/img/no-imagen.png';

  fileList: NzUploadFile[] = [];

  loading_save_file: boolean = false;

  constructor(
    private services: ServicesService,
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  /** Método inicial del componente */
  ngOnInit(): void {
    this.change();
    this.evaluateDisabled();
  }

  evaluateDisabled() {
    if (this.field.disabled) {
      const codeControl = this.form.get('code');
      if (codeControl) {
        console.log(codeControl);
        codeControl.disable(); // Deshabilitar el campo
        codeControl.clearValidators(); // Quitar el validador 'required'
        codeControl.updateValueAndValidity(); // Actualizar la validez del control
      }
    }
  }

  /** Atributo que define si el campo es válido */
  get isValid() {
    return this.form.controls[this.field.key].valid;
  }

  refreshScreen(): void {
    setTimeout(() => {
      this.cd.markForCheck();
    }, 10);
  }

  /**
   * Métdo que se ejecuta cuando el campo cambia de valor
   */
  change() {
    let val_field = this.form.controls[this.field.key].value;
    let data = { fieldConfig: this.field, val: val_field };
    this.ChangeField.emit(data);

    try {
      switch (this.field.controlType) {
        case 'file':
          this.setValToFile(val_field);
      }
    } catch (error) {
      console.error('Ocurrio un error al cargar la data en el formulario');
    }

    // this.refreshScreen();
    // console.log(this.field)
  }

  /**
   * Método que devuelve un control del formulario en base a la key
   * @param key identificador del control del formulario
   */
  getFormControls(key: any): FormArray {
    return this.form.get(key) as FormArray;
  }

  /**
   * Método que devulve un form group con la configuracion inicial de un campo grupo
   */
  private getConfigInitialGroup(): any {
    return this.services.fcs.getGroup(this.field).controls[0];
  }

  /**
   * Métood para agregar una nueva fila a un campo de tipo grupo
   */
  addRow(): void {
    const control = this.form.get(this.field.key) as FormArray;
    control.push(this.getConfigInitialGroup());
  }

  deleteRow(index: number): void {
    const control = this.form.get(this.field.key) as FormArray;
    control.removeAt(index);
  }

  /**
   * Método para mostrar una vista de la imagen cargada
   * @param file imagen
   */
  private prevImagen(file: any) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      this.imgPrevURL = reader.result;
      this.cd.markForCheck();
    };
  }

  /**
   * Método para agregar un archivo a la lista de archivos
   * @param file
   */
  beforeUpload = (file: NzUploadFile): boolean => {
    let tipos = this.getTypeFile(this.field.type);
    if (tipos && file.type && tipos.includes(file.type)) {
      this.services.notificacionesService.showMessage(
        'error',
        'Tipo de archivo no válido'
      );
      return false;
    }

    const isLt2M = file.size! / 1024 / 1024 < 35;
    if (!isLt2M) {
      this.services.notificacionesService.showMessage(
        'error',
        'File must smaller than 35MB!'
      );
      return false;
    }

    var mimeType = file.type;
    if (mimeType && mimeType.match(/image\/*/) != null) {
      this.prevImagen(file);
    }

    this.loading_save_file = true;

    this.services.backendService.postBackend(
      'api/v1/file',
      {},
      { archivo: file },
      (response: any) => {
        this.fileList = this.fileList.concat(file);
        this.form.get(this.field.key).setValue(response.item.id);
        this.loading_save_file = false;
        this.cd.markForCheck();
      },
      (error: any) => {
        this.loading_save_file = false;
        console.error(error);
      },
      true
    );
    return false;
  };

  /**
   * Método que se ejecuta al eliminar un elemento de la lista de archivos
   * @param e
   */
  deleteFile(e: any) {
    this.imgPrevURL = null;
    if (this.field.type == 'imagen') this.imgPrevURL = this.url_no_imagen;
    this.form.controls[this.field.key].reset();
    this.fileList = [];
  }

  /**
   * Método para obtener el formato de del archivo permitido
   * @param type imagen,video
   */
  private getTypeFile(type: any): string {
    switch (type) {
      case 'imagen':
        return 'image/jpg,image/png,image/jpeg,image/gif,image/bmp';
      case 'video':
        return 'video/mp4,video/avi,video/mpeg4,video/mpeg,video/mkv,video/flv,video/mov,video/wmv';
      case 'audio':
        return 'audio/mp3,audio/wav,audio/aiff,audio/mp4,audio/aac,audio/mpeg-4,audio/mpeg,audio/ogg';
    }

    return '';
  }

  /**
   * Método para establecer un archivo file en el componente
   * @param val
   */
  setValToFile(val: any) {
    if (val) {
      val = this.services.informacionService.getUrlFiles() + val;
      this.fileList = [
        {
          uid: '-1',
          name: val,
          status: 'done',
          url: val,
        },
      ];
      if (this.field.type == 'imagen') this.imgPrevURL = val;
    } else {
      this.fileList = [];
      if (this.field.type == 'imagen') this.imgPrevURL = this.url_no_imagen;
    }
  }

  onSearch(value: string): void {
    let data = { fieldConfig: this.field, val: value };

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.Search.emit(data);
      clearTimeout(this.timeout);
    }, 300);
  }
}
