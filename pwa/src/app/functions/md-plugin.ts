import Editor from '@toast-ui/editor';
import HTMLToken = toastui.HTMLToken;
import OpenTagToken = toastui.OpenTagToken;
import CloseTagToken = toastui.CloseTagToken;
import PluginInfo = toastui.PluginInfo;
import Convertor = toastui.Convertor;

class MdConvertor implements Convertor {
  public constructor(private defaultConvertor: Convertor, private inlineIcon?: string) {
  }

  public initHtmlSanitizer(sanitizer: toastui.Sanitizer): void {
    this.defaultConvertor.initHtmlSanitizer(sanitizer);
  }

  public toHTML(makrdown: string): string {
    return this.defaultConvertor.toHTML(makrdown);
  }

  public toHTMLWithCodeHighlight(markdown: string): string {
    return this.defaultConvertor.toHTMLWithCodeHighlight(markdown);
  }

  public toMarkdown(html: string, toMarkdownOptions: toastui.ToMarkOptions): string {
    html = this.removeNonStandardElements(html);
    const md = this.defaultConvertor.toMarkdown(html, toMarkdownOptions);

    const dom = new DOMParser().parseFromString(md, 'text/html');
    dom.querySelectorAll('br').forEach(t => t.remove());
    return dom.body.innerHTML;
  }

  private fixComponentBugs(dom: Document): void {
    dom.querySelectorAll('br:only-child').forEach(x => {
      x.parentElement.insertBefore(dom.createTextNode('\u00A0'), x);
    });
  }

  private removeNonStandardElements(html: string): string {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    dom.querySelectorAll('[data-type="user"]').forEach(x => x.replaceWith(x.innerHTML));
    dom.querySelectorAll<HTMLAnchorElement>('[data-type="card-link"]').forEach(x => {
      x.href = x.href.substring(x.href.lastIndexOf('/'));
      x.attributes.removeNamedItem('data-type');
    });
    dom.querySelectorAll<HTMLElement>('[data-type="separator"]').forEach(x => x.replaceWith('&nbsp;'+x.innerHTML));

    this.fixComponentBugs(dom);

    return dom.body.innerHTML;
  }
}

export function mdPlugin(): PluginInfo {
  return <PluginInfo>{
    renderer: {
      text: node => {
        const regExp = new RegExp('(?<mention>@[\\w.]+)');
        let text = node.literal;
        const result: Array<HTMLToken> = [];

        let match = regExp.exec(text);

        while (match) {
          if (match.index > 0) {
            result.push({
              type: 'text',
              content: text.substring(0, match.index),
            });

            text = text.substring(match.index);
          }

          const matchedLen = match[0].length;
          result.push({
            type: 'html',
            content: `<a href="javascript:void(0)" data-type="user" class="text-primary-balanced">${text.substring(0, matchedLen)}</a>&nbsp;`
          });

          text = text.substring(matchedLen);
          match = regExp.exec(text);
        }

        if (text?.length) {
          result.push({
            type: 'text',
            content: text
          });
        }

        return result;
      },
      link: node => {
        if (node['processed']) {
          return <CloseTagToken>{
            type: 'closeTag',
            tagName: 'a'
          };
        }

        let destination = node['destination'] as string;
        node['processed'] = true;

        const cardLinkRegExp = new RegExp('^\\/(?<cardId>\\d+)$').exec(destination);
        const cardLongLinkMatch = new RegExp('\\/card\\/(?<cardId>\\d+)(\\?focus=(?<focusType>\\w+)&focusId=(?<focusId>\\d+))?').exec(destination);

        const cardId = cardLinkRegExp?.groups['cardId'] || cardLongLinkMatch?.groups['cardId'];
        const cardFocusType = cardLongLinkMatch?.groups['focusType'];
        const cardFocusId = cardLongLinkMatch?.groups['focusId'];

        if (cardId) {
          destination = `/card/${cardId}`;
        }

        if (cardId && cardFocusType && cardFocusId) {
          destination += `#${cardFocusType}_${cardFocusId}`;
        }

        return <OpenTagToken>{
          type: 'openTag',
          attributes: {
            href: destination,
            'data-type': 'card-link'
          },
          tagName: 'a'
        };
      }
    },
    parser: {

    },
    pluginFn: (editor: Editor,) => {
      editor['convertor'] = new MdConvertor(editor['convertor']);
    }
  };
}
