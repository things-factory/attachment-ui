import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/setting-base'
import { css, html, LitElement } from 'lit-element'

import gql from 'graphql-tag'
import { client, gqlBuilder, InfiniteScrollable, ScrollbarStyles } from '@things-factory/shell'
import './attachment-creation-card'
import ClipboardJS from 'clipboard'

const FETCH_ATTACHMENT_LIST_GQL = listParam => {
  return gql`
  {
    attachments(${gqlBuilder.buildArgs(listParam)}) {
      items {
        id
        name
        description
        mimetype
        encoding
        category
        path
      }
      total
    }
  }
`
}

const DELETE_ATTACHMENT_GQL = gql`
  mutation DeleteAttachment($id: String!) {
    deleteAttachment(id: $id) {
      id
      name
      description
      mimetype
      encoding
      category
      path
      createdAt
      updatedAt
    }
  }
`

const CREATE_ATTACHMENTS_GQL = gql`
  mutation($attachments: [NewAttachment]!) {
    createAttachments(attachments: $attachments) {
      id
      name
      description
      mimetype
      encoding
      category
      path
      createdAt
      updatedAt
    }
  }
`

export class AttachmentSelector extends InfiniteScrollable(localize(i18next)(LitElement)) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: grid;
          grid-template-rows: auto auto 1fr;
          overflow: hidden;
          background-color: var(--popup-content-background-color);
        }

        :host(.candrop) {
          background: orange;
          cursor: pointer;
        }

        #main {
          overflow: auto;
          padding: var(--popup-content-padding);
          display: grid;
          grid-template-columns: var(--card-list-template);
          grid-auto-rows: var(--card-list-rows-height);
          grid-gap: 20px;
        }

        #main .card {
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          border-radius: var(--card-list-border-radius);
          border: var(--attachment-selector-border);
          background-color: var(--attachment-selector-background-color);

          position: relative;
        }

        #main .card.create {
          overflow: visible;
        }

        #main .card:hover {
          cursor: pointer;
        }

        .name {
          background-color: rgba(1, 126, 127, 0.8);
          position: absolute;
          bottom: 0px;
          width: 100%;
          padding: 2px 5px;
          font: var(--attachment-selector-name-font);
          color: #fff;
          text-indent: 7px;
        }

        .card img,
        .card video {
          max-height: 100%;
          min-height: 100%;
        }

        mwc-icon {
          position: absolute;
          right: 0px;
          text-align: center;

          background-color: var(--attachment-selector-icon-background-color);
          width: var(--attachment-selector-icon-size);
          height: var(--attachment-selector-icon-size);
          font: var(--attachment-selector-icon-font);
          color: var(--attachment-selector-icon-color);
        }
        mwc-icon:hover,
        mwc-icon:active {
          background-color: var(--primary-color);
          color: #fff;
        }
        [clipboard] {
          top: 0px;
        }
        [delete] {
          top: 35px;
        }
        [download] {
          top: 70px;
          border-bottom-left-radius: 12px;
        }

        #filter {
          padding: var(--popup-content-padding);
          background-color: var(--attachment-tools-background-color);
          box-shadow: var(--box-shadow);
        }

        #filter * {
          font-size: 15px;
        }

        select {
          text-transform: capitalize;
          float: right;
        }
      `
    ]
  }

  static get properties() {
    return {
      categories: Array,
      attachments: Array,
      category: String,
      _page: Number,
      _total: Number,
      creatable: Boolean
    }
  }

  constructor() {
    super()

    this.categories = ['audio', 'video', 'image', 'text', 'application']
    this.attachments = []

    this._page = 1
    this._total = 0

    this._infiniteScrollOptions.limit = 20
  }

  render() {
    return html`
      <div id="filter">
        <select
          @change=${e => {
            this.category = e.currentTarget.value
            this.requestUpdate()
          }}
        >
          <option value="">--${i18next.t('text.please choose a category')}--</option>
          ${this.categories.map(
            category => html`
              <option value=${category}>${category}</option>
            `
          )}
        </select>
      </div>

      <div
        id="main"
        @scroll=${e => {
          this.onScroll(e)
        }}
      >
        ${this.creatable
          ? html`
              <attachment-creation-card
                class="card create"
                .categories=${this.categories}
                .defaultCategory=${this.category}
                @create-attachment=${e => this.onCreateAttachment(e)}
                @attachment-dropped=${e => this.onAttachmentDropped(e)}
              ></attachment-creation-card>
            `
          : html``}
        ${this.attachments.map(
          attachment => html`
            <div
              class="card"
              data-clipboard-text=${`/attachment/${attachment.path}`}
              @click=${e => this.onClickSelect(attachment)}
            >
              ${attachment.category == 'image'
                ? html`
                    <img src=${`/attachment/${attachment.path}`} />
                  `
                : attachment.category == 'video'
                ? html`
                    <video src=${`/attachment/${attachment.path}`} controls></video>
                  `
                : html`
                    <img
                      src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                      @click=${e => window.open(`/attachment/${attachment.path}`)}
                    />
                  `}
              <div class="name">${attachment.name}</div>
              <mwc-icon class="clipboard" clipboard>file_copy</mwc-icon>
              <mwc-icon @click=${e => this.onDeleteAttachment(attachment.id)} delete>delete</mwc-icon>
            </div>
          `
        )}
      </div>
    `
  }

  get scrollTargetEl() {
    return this.renderRoot.querySelector('#main')
  }

  async scrollAction() {
    return this.appendAttachments()
  }

  firstUpdated() {
    this._clipboard = new ClipboardJS('.clipboard', {
      container: this.shadowRoot.querySelector('#main'),
      target: function(trigger) {
        trigger.parentElement
      }
    })

    this.refreshAttachments()
  }

  disconnectedCallback() {
    super.disconnectedCallback()

    this._clipboard.destroy()
  }

  updated(changed) {
    if (changed.has('category')) {
      this.refreshAttachments()
    }
  }

  onClickSelect(attachment) {
    this.dispatchEvent(
      new CustomEvent('attachment-selected', {
        composed: true,
        bubbles: true,
        detail: {
          attachment
        }
      })
    )
  }

  async onAttachmentDropped(e) {
    var files = e.detail

    await this.createAttachments('', files)
    this.refreshAttachments()
  }

  async onCreateAttachment(e) {
    var { category, files } = e.detail

    var fileArray = []
    for (var i = 0; i < files.length; i++) {
      fileArray.push(files[i])
    }

    await this.createAttachments(category, fileArray)
    this.refreshAttachments()
  }

  async onDeleteAttachment(id) {
    await this.deleteAttachment(id)

    this.refreshAttachments()
  }

  async refreshAttachments() {
    var attachments = await this.getAttachments()
    this.attachments = [...attachments]

    var creationCard = this.shadowRoot.querySelector('attachment-creation-card')
    if (creationCard) {
      creationCard.reset()
    }
  }

  async appendAttachments() {
    var attachments = await this.getAttachments({ page: this._page + 1 })
    this.attachments = [...this.attachments, ...attachments]
  }

  async getAttachments({ page = 1, limit = this._infiniteScrollOptions.limit } = {}) {
    var filters = []
    var sortings = []
    var pagination = {
      limit,
      page
    }

    if (this.category)
      filters.push({
        name: 'category',
        operator: 'eq',
        value: this.category
      })

    var params = {
      filters,
      sortings,
      pagination
    }
    var attachmentListResponse = await client.query({
      query: FETCH_ATTACHMENT_LIST_GQL(params)
    })

    if (!attachmentListResponse || !attachmentListResponse.data) return []
    this._total = attachmentListResponse.data.attachments.total
    this._page = page

    return attachmentListResponse.data.attachments.items
  }

  async createAttachments(category, files) {
    /*
      ref. https://github.com/jaydenseric/graphql-multipart-request-spec#client
        - TODO support multiple file upload
    */

    await client.mutate({
      mutation: CREATE_ATTACHMENTS_GQL,
      variables: {
        attachments: files.map(file => {
          return { category, file }
        })
      },
      context: {
        hasUpload: true
      }
    })
  }

  async deleteAttachment(id) {
    const response = await client.mutate({
      mutation: DELETE_ATTACHMENT_GQL,
      variables: {
        id
      }
    })

    return response.data
  }
}

customElements.define('attachment-selector', AttachmentSelector)
