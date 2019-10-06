import { LitElement, html, css } from 'lit-element'
import { i18next, localize } from '@things-factory/i18n-base'
import { AttachmentImporter } from './attachment-importer'

export class AttachmentCreationCard extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      /* default category id */
      defaultCategory: String,
      categories: Array
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

        [front].candrop {
          background-color: tomato;
          cursor: pointer;
        }

        [front] mwc-icon {
          margin-top: 15%;
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
          display: flex;
          flex-flow: row wrap;
        }

        [back] form label {
          flex: 1 1 25%;
          font: var(--card-list-create-label-font);
          color: var(--card-list-create-label-color);
        }

        [back] form input,
        [back] form select {
          flex: 1 1 60%;
          width: 10px;
          background-color: #fff;
          border: var(--card-list-create-input-border);
          border-radius: var(--card-list-create-input-border-radius);
          padding: var(--card-list-create-input-padding);
          font: var(--card-list-create-input-font);
          color: var(--card-list-create-input-color);
        }

        form * {
          margin: var(--card-list-create-margin);
        }

        input[type='submit'] {
          background-color: var(--button-background-color) !important;
          margin: var(--button-margin);
          font: var(--button-font);
          color: var(--button-color) !important;
          border-radius: var(--button-radius);
          border: var(--button-border);
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
          <select .value=${this.defaultCategory} name="category">
            <option value="">--${i18next.t('text.please choose a category')}--</option>
            ${categories.map(
              category => html`
                <option value=${category} ?selected=${this.defaultCategory == category}>${category}</option>
              `
            )}
          </select>

          <label>${i18next.t('label.file')}</label>
          <input type="file" name="file" />

          <input type="submit" value=${i18next.t('button.create')} />
        </form>
      </div>
    `
  }

  firstUpdated() {
    // AttachmentImporter.set(this.shadowRoot.querySelector('[front]'))
    AttachmentImporter.set(this)
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
    var file = form.elements['file'].value

    this.dispatchEvent(
      new CustomEvent('create-attachment', {
        detail: {
          category,
          file
        }
      })
    )
  }

  reset() {
    var form = this.shadowRoot.querySelector('form')
    if (form) {
      form.reset()
    }

    this.classList.remove('flipped')
  }
}

customElements.define('attachment-creation-card', AttachmentCreationCard)
