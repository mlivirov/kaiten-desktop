import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer';
import Editor, { CustomConvertor } from '@toast-ui/editor';
import Plugin = toastui.Plugin;
import HTMLToken = toastui.HTMLToken;
import OpenTagToken = toastui.OpenTagToken;
import CloseTagToken = toastui.CloseTagToken;
import PluginInfo = toastui.PluginInfo;
import Convertor = toastui.Convertor;
import WysiwygEditor = toastui.WysiwygEditor;

class MdConvertor implements Convertor {
  constructor(private defaultConvertor: Convertor, private inlineIcon?: string) {
  }

  initHtmlSanitizer(sanitizer: toastui.Sanitizer): void {
    this.defaultConvertor.initHtmlSanitizer(sanitizer);
  }

  toHTML(makrdown: string): string {
    return this.defaultConvertor.toHTML(makrdown);
  }

  toHTMLWithCodeHighlight(markdown: string): string {
    return this.defaultConvertor.toHTMLWithCodeHighlight(markdown);
  }

  toMarkdown(html: string, toMarkdownOptions: toastui.ToMarkOptions): string {
    html = this.removeNonStandardElements(html);
    const md = this.defaultConvertor.toMarkdown(html, toMarkdownOptions);
    return md;
  }

  fixComponentBugs(dom: Document) {
    dom.querySelectorAll('br:only-child').forEach(x => {
      x.parentElement.insertBefore(dom.createTextNode('\u00A0'), x);
    });

    dom.querySelectorAll('br + br').forEach(x => x.remove());
  }

  removeNonStandardElements(html: string): string {
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

class MdPlugin implements PluginInfo
{
  parser: toastui.CustomParserMap;

  renderer: toastui.CustomHTMLRendererMap;

  pluginFn(editor: toastui.Editor | toastui.Viewer, options: any): void {
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

        const cardLinkRegExp = new RegExp('^\\/\\d+$');
        if (cardLinkRegExp.test(destination)) {
          destination = `/card` + destination;
        }

        const cardLongLinkMatch = new RegExp('space\\/\\d+\\/card\\/(?<cardId>\\d+)').exec(destination);
        if (cardLongLinkMatch) {
          destination = `/card/` + cardLongLinkMatch.groups['cardId'];
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
    pluginFn: (editor: Editor, options: any) => {
      editor['convertor'] = new MdConvertor(editor['convertor']);
    }
  };
}