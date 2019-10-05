import { i18next, localize } from '@things-factory/i18n-base'
import '@things-factory/setting-base'
import { css, html, LitElement } from 'lit-element'

import gql from 'graphql-tag'
import { client, gqlBuilder, InfiniteScrollable, ScrollbarStyles } from '@things-factory/shell'
import './attachment-creation-card'
import { AttachmentImporter } from './attachment-importer'

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
      }
      total
    }
  }
`
}

const CREATE_ATTACHMENT_GQL = gql`
  mutation CreateAttachment($attachment: NewAttachment!) {
    createAttachment(attachment: $attachment) {
      id
      name
      description
      mimetype
      encoding
      category
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
          background-color: var(--card-list-background-color);
        }

        #main .card.create {
          overflow: visible;
        }

        #main .card:hover {
          cursor: pointer;
        }

        #main .card > .name {
          background-color: rgba(1, 126, 127, 0.8);
          margin-top: -35px;
          width: 100%;
          color: #fff;
          font-weight: bolder;
          font-size: 13px;
          text-indent: 7px;
        }

        #main .card > .description {
          background-color: rgba(0, 0, 0, 0.7);
          width: 100%;
          min-height: 15px;
          font-size: 0.6rem;
          color: #fff;
          text-indent: 7px;
        }
        #main .card img {
          max-height: 100%;
          min-height: 100%;
        }

        #filter {
          padding: var(--popup-content-padding);
          background-color: #fff;
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

    this.categories = ['image', 'font', 'document', 'video'].map((mediatype, index) => {
      return {
        id: mediatype,
        description: mediatype
      }
    })
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
              <option value=${category.id}>${category.description}</option>
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
              ></attachment-creation-card>
            `
          : html``}
        ${this.attachments.map(
          attachment => html`
            <div class="card" @click=${e => this.onClickSelect(attachment)}>
              <img src=${attachment.thumbnail} />
              <div class="name">${attachment.name}</div>
              <div class="description">${attachment.description}</div>
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
    AttachmentImporter.set(this)
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

  async onCreateAttachment(e) {
    var { name, description, categoryId } = e.detail

    await this.createAttachment(name, description, categoryId)
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

  async createAttachment(name, description, category) {
    var model = JSON.stringify({
      width: 800,
      height: 600
    })

    const response = await client.mutate({
      mutation: CREATE_ATTACHMENT_GQL,
      variables: {
        attachment: {
          name,
          description,
          category,
          model
        }
      }
    })

    return response.data
  }
}

customElements.define('attachment-selector', AttachmentSelector)
