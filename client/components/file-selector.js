import '@material/mwc-icon'
import '@material/mwc-icon-button'
import { css, html, LitElement } from 'lit-element'

export class FileSelector extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        #input-box {
          display: flex;
          width: 100%;
          height: 100%;
        }

        input[type='file'] {
          position: absolute;
          width: 0px;
          height: 0px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        label {
          padding: unset;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;

          color: var(--file-selector-color, #999);
          font-size: inherit;
          line-height: normal;
          vertical-align: middle;
          background-color: var(--file-selector-bg-color, #fdfdfd);
          cursor: pointer;
          border: var(--file-selector-border, 1px solid #ebebeb);
          border-radius: var(--file-selector-border-radius, 0.25em);
        }

        /* named upload */
        .upload-name {
          flex: 1;
          padding: 0.5em 0.75em; /* label의 패딩값과 일치 */
          font-size: inherit;
          font-family: inherit;
          line-height: normal;
          vertical-align: middle;
          background-color: #f5f5f5;
          border: 1px solid #ebebeb;
          border-bottom-color: #e2e2e2;
          border-radius: 0.25em;
          -webkit-appearance: none; /* 네이티브 외형 감추기 */
          -moz-appearance: none;
          appearance: none;
        }
      `
    ]
  }

  static get properties() {
    return {
      label: String,
      accept: String,
      showFilename: {
        type: Boolean,
        attribute: 'show-filename'
      },
      multiple: {
        type: Boolean,
        attribute: 'multiple'
      },
      _files: Array
    }
  }

  constructor() {
    super()

    this._files = []
    this.label = 'select file'
    this.multiple = false
  }

  render() {
    return html`
      <div id="input-box">
        ${this.showFilename
          ? html`
              <input class="upload-name" value="${this._files.map(f => f.name).join(', ') || this.label}" disabled />
            `
          : html``}
        <label for="input-file">${this.label}</label>
        <input
          id="input-file"
          type="file"
          accept="${this.accept}"
          class="upload-hidden"
          ?multiple=${this.multiple}
          hidden
          @change=${e => {
            const el = e.currentTarget
            this.dispatchEvent(
              new CustomEvent('file-change', {
                bubbles: true,
                composed: true,
                detail: {
                  files: el.files
                }
              })
            )

            el.value = null
          }}
        />
      </div>
    `
  }

  get fileInput() {
    return this.renderRoot.querySelector('#input-file')
  }

  onImageFileChanged(e) {
    this._files = [...this._files, ...Array.from(e.currentTarget.files)]
  }

  async _onUploadButtonClick(e) {
    var response = await this.createAttachments('', this._files)
    var { createAttachments } = response.data

    if (createAttachments.length == 0) return

    this._files = []
    this.fileInput.value = ''

    this.dispatchEvent(
      new CustomEvent('image-upload-succeeded', {
        bubbles: true,
        composed: true,
        detail: {
          files: createAttachments
        }
      })
    )
  }
}

window.customElements.define('file-selector', FileSelector)
