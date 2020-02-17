import { LitElement, html, css } from 'lit-element'
import { i18next, localize } from '@things-factory/i18n-base'
import { FileDropHelper } from '@things-factory/utils'
import './components/file-selector'
import '@things-factory/image-uploader-ui/client/image-upload-previewer'

export class AttachmentCreationCard extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      /* default category id */
      defaultCategory: String,
      categories: Array,
      _files: Array,
      _currentCategory: String
    }
  }

  static get styles() {
    return [
      css`
        :host {
          position: relative;

          padding: 0;
          margin: 0;
          height: 100%;

          -webkit-transform-style: preserve-3d;
          transform-style: preserve-3d;
          -webkit-transition: all 0.5s ease-in-out;
          transition: all 0.5s ease-in-out;
          box-shadow: var(--box-shadow);
        }

        :host(.flipped) {
          -webkit-transform: var(--card-list-flip-transform);
          transform: var(--card-list-flip-transform);
        }

        [front],
        [back] {
          position: absolute;

          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;

          border: var(--card-list-create-border);
          border-radius: var(--card-list-create-border-radius);

          background-color: #fff;

          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        [front] {
          text-align: center;
          font-size: 0.8em;
          color: var(--card-list-create-color);
          text-transform: capitalize;
        }

        :host(.candrop) [front],
        :host(.candrop) [back] {
          border-width: 2px;
          background-color: #fffde9;
        }

        [front] mwc-icon {
          margin-top: 55px;
          display: block;
          font-size: 3.5em;
          color: var(--card-list-create-icon-color);
        }

        [back] {
          -webkit-transform: var(--card-list-flip-transform);
          transform: var(--card-list-flip-transform);
        }

        [back] form {
          padding: var(--card-list-create-form-padding);
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          grid-template-rows: min-content min-content 1fr min-content;
          grid-row-gap: 7px;
          justify-content: center;
          align-items: center;
        }

        [back] form label {
          grid-column: span 4;
          font: var(--card-list-create-label-font);
          color: var(--card-list-create-label-color);
        }

        [back] form input,
        [back] form select {
          grid-column: span 6;
          background-color: #fff;
          border: var(--card-list-create-input-border);
          border-radius: var(--card-list-create-input-border-radius);
          padding: var(--card-list-create-input-padding);
          font: var(--card-list-create-input-font);
          color: var(--card-list-create-input-color);
        }

        file-selector {
          grid-column: span 6;
          font: var(--card-list-create-input-font);
          border: none;
          box-sizing: border-box;
          padding: 0;
        }

        #thumbnail-area {
          grid-column: span 10;
          align-self: stretch;
          text-align: center;
          overflow: hidden;
          overflow-x: auto;
          white-space: nowrap;
        }

        image-upload-previewer {
          display: inline-block;
          height: 100%;
        }

        [back] input[type='submit'] {
          background-color: var(--button-background-color) !important;
          margin: var(--button-margin);
          font: var(--button-font);
          color: var(--button-color) !important;
          border-radius: var(--button-radius);
          border: var(--button-border);
          grid-column: span 10;
          grid-row: auto / -1;
          margin: 0;
        }
      `
    ]
  }

  render() {
    var categories = this.categories || []

    return html`
      <div @click=${e => this.onClickFlip(e)} front>
        <mwc-icon>add_circle_outline</mwc-icon>${i18next.t('text.create attachment')}
      </div>

      <div @click=${e => this.onClickFlip(e)} back>
        <form @submit=${e => this.onClickSubmit(e)}>
          <label>${i18next.t('label.category')}</label>
          <select
            .value=${this.defaultCategory}
            name="category"
            @change=${e => {
              this._currentCategory = e.currentTarget.value
            }}
          >
            <option value="">--${i18next.t('text.please choose a category')}--</option>
            ${categories.map(
              category => html`
                <option value=${category} ?selected=${this.defaultCategory == category}>${category}</option>
              `
            )}
          </select>

          <label>${i18next.t('label.file')}</label>
          <file-selector
            name="file"
            label="${i18next.t('label.select file')}"
            accept="${this._currentCategory || '*'}/*"
            multiple
            @file-change=${e => {
              this._files = Array.from(e.detail.files)
            }}
          ></file-selector>

          <div id="thumbnail-area">
            ${this._files.map(
              file => html`
                <image-upload-previewer .file=${file}></image-upload-previewer>
              `
            )}
          </div>

          <!-- ${/^(video|image)/.test((this._files || {}).type)
            ? html`
                <image-upload-previewer .file=${this._files}></image-upload-previewer>
              `
            : html``} -->

          <input type="submit" value=${i18next.t('button.create')} />
        </form>
      </div>
    `
  }

  constructor() {
    super()

    this._files = []
  }

  firstUpdated() {
    FileDropHelper.set(this)
  }

  onClickFlip(e) {
    if (
      e.currentTarget.hasAttribute('front') ||
      (e.currentTarget.hasAttribute('back') && e.target.tagName != 'INPUT' && e.target.tagName != 'SELECT')
    ) {
      this.classList.toggle('flipped')
    }

    e.stopPropagation()
  }

  onClickSubmit(e) {
    e.preventDefault()
    e.stopPropagation()

    var form = e.target

    var category = form.elements['category'].value
    var files = this._files

    this.dispatchEvent(
      new CustomEvent('create-attachment', {
        detail: {
          category,
          files
        }
      })
    )
  }

  reset() {
    var form = this.shadowRoot.querySelector('form')
    if (form) {
      form.reset()
      this._files = []
    }

    this.classList.remove('flipped')
  }
}

customElements.define('attachment-creation-card', AttachmentCreationCard)
