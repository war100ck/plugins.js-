;(function($, Lampa) {
    var Modal = /** @class */ (function() {
        var modalID = 0;

        function Modal(params) {
            this.id = ++modalID;
            this.active = params;
            this.html = Lampa.Template.get('modal', { title: params.title });
            this.scroll = new Lampa.Scroll({ over: true, mask: params.mask });
            this.last = false;
        }

        Modal.prototype.open = function() {
            var _this = this;
            
            this.html.on('click', function(e) {
                if (!$(e.target).closest($('.modal__content', _this.html)).length && 
                    Lampa.DeviceInput.canClick(e.originalEvent)) {
                    window.history.back();
                }
            });

            this.title(this.active.title);

            // Размеры модального окна
            this.html.toggleClass('modal--medium', this.active.size === 'medium');
            this.html.toggleClass('modal--large', this.active.size === 'large');
            this.html.toggleClass('modal--full', this.active.size === 'full');
            this.html.toggleClass('modal--overlay', !!this.active.overlay);
            this.html.toggleClass('modal--align-center', this.active.align === 'center');

            if (this.active.zIndex) this.html.css('z-index', this.active.zIndex);

            this.scroll.render().toggleClass('layer--height', this.active.size === 'full');
            this.html.find('.modal__body').append(this.scroll.render());

            this.bind(this.active.html);

            this.scroll.onWheel = function(step) {
                this.roll(step > 0 ? 'down' : 'up');
            };

            this.scroll.append(this.active.html);
            
            if (this.active.buttons) this.buttons();
            
            $('body').append(this.html);
            this.max();
            this.toggle(this.active.select);
        };

        Modal.prototype.max = function() {
            var content = this.scroll.render().find('.scroll__content');
            var offset = this.scroll.render().offset().top;
            var height = Math.round(window.innerHeight - offset - (window.innerHeight * 0.1));
            
            content.css('max-height', height + 'px');
        };

        Modal.prototype.buttons = function() {
            var footer = $('<div class="modal__footer"></div>');
            
            this.active.buttons.forEach(function(button) {
                var btn = $('<div class="modal__button selector" style="width: 50%; text-align: center;"></div>');
                
                btn.text(button.name);
                btn.on('click hover:enter', function() {
                    button.onSelect();
                });
                
                footer.append(btn);
            });
            
            this.scroll.append(footer);
        };

        Modal.prototype.bind = function(where) {
            var _this = this;
            
            where.find('.selector')
                .on('hover:focus', function(e) {
                    _this.last = e.target;
                    _this.scroll.update($(e.target));
                })
                .on('hover:enter', function(e) {
                    _this.last = e.target;
                    if (_this.active.onSelect) _this.active.onSelect($(e.target));
                });
        };

        Modal.prototype.jump = function(tofoward) {
            var select = this.scroll.render().find('.selector.focus');
            
            if (tofoward) {
                select = select.nextAll().filter('.selector');
            } else {
                select = select.prevAll().filter('.selector');
            }
            
            select = select.slice(0, 10);
            select = select.last();
            
            if (select.length) {
                Lampa.Controller.collectionFocus(select[0], this.scroll.render());
            }
        };

        Modal.prototype.roll = function(direction) {
            var select = this.scroll.render().find('.selector');
            
            if (select.length) {
                Navigator.move(direction);
            } else {
                var step = Math.round(window.innerHeight * 0.15);
                this.scroll.wheel(direction === 'down' ? step : -step);
            }
        };

        Modal.prototype.toggle = function(need_select) {
            var _this = this;
            
            Lampa.Controller.add('Modal-' + this.id, {
                invisible: true,
                toggle: function() {
                    Lampa.Controller.collectionSet(_this.scroll.render());
                    Lampa.Controller.collectionFocus(need_select || _this.last, _this.scroll.render());
                    Lampa.Layer.visible(_this.scroll.render(true));
                },
                up: function() {
                    _this.roll('up');
                },
                down: function() {
                    _this.roll('down');
                },
                right: function() {
                    if (Navigator.canmove('right')) {
                        Navigator.move('right');
                    } else {
                        _this.jump(true);
                    }
                },
                left: function() {
                    if (Navigator.canmove('left')) {
                        Navigator.move('left');
                    } else {
                        _this.jump(false);
                    }
                },
                back: function() {
                    if (_this.active.onBack) _this.active.onBack();
                }
            });
            
            Lampa.Controller.toggle('Modal-' + this.id);
        };

        Modal.prototype.update = function(new_html) {
            this.last = false;
            this.scroll.clear();
            this.scroll.append(new_html);
            this.bind(new_html);
            this.max();
            this.toggle(this.active.select);
        };

        Modal.prototype.title = function(title) {
            this.html.find('.modal__title').text(title);
            this.html.toggleClass('modal--empty-title', !title);
        };

        Modal.prototype.destroy = function() {
            this.last = false;
            this.scroll.destroy();
            this.html.remove();
        };

        Modal.prototype.close = function() {
            this.destroy();
        };

        Modal.prototype.render = function() {
            return this.html;
        };

        return Modal;
    })();

    // Локализация
    Lampa.Lang.add({
        ts_preload_preload: {
            en: 'Preload',
            ru: 'Предзагрузка',
            be: 'Перадзагрузка',
            uk: 'Передзавантаження',
            pt: 'Pré-carregar',
            zh: '预加载'
        },
        ts_preload_speed: {
            en: 'Speed',
            ru: 'Скорость загрузки',
            be: 'Хуткасць загрузкі',
            uk: 'Швидкість',
            pt: 'Velocidade',
            zh: '速度'
        },
        ts_preload_seeds: {
            en: 'seeds',
            ru: 'раздают',
            be: 'раздаюць',
            uk: 'роздають',
            pt: 'entregam',
            zh: '种子数'
        },
        ts_preload_peers: {
            en: 'Peers',
            ru: 'Подключились',
            be: 'Падключыліся',
            uk: 'Підключилися',
            pt: 'Conectado',
            zh: '连接数'
        }
    });

    // Получение IP Torrserver
    function tsIP() {
        // Для поддержки версии 1.6.5
        if (!!Lampa.Torserver && !!Lampa.Torserver.ip) {
            return Lampa.Torserver.ip();
        }
        
        var useLink = Lampa.Storage.field('torrserver_use_link');
        var storageField = useLink === 'two' ? 'torrserver_url_two' : 'torrserver_url';
        
        return Lampa.Storage.get(storageField);
    }

    // Отключение предзагрузки Lampa
    if (!!Lampa.Torserver && !!Lampa.Torserver.stream && !!Lampa.Torserver.url) {
        Lampa.Torserver.stream = function(path, hash, id) {
            var filename = encodeURIComponent(path.split('\\').pop().split('/').pop());
            return Lampa.Torserver.url() + '/stream/' + filename + 
                   '?link=' + hash + '&index=' + id + '&play';
        };
    }

    // Сохранение оригинальных функций
    var lampaPlay = Lampa.Player.play;
    var lampaCallback = Lampa.Player.callback;
    var lampaPlaylist = Lampa.Player.playlist;
    var lampaStat = Lampa.Player.stat;
    
    var player = null;

    // Класс Player для управления предзагрузкой
    var Player = /** @class */ (function() {
        function Player(data) {
            var parsed = parseUrl(data.url);
            data.url = parsed.clearUrl + '&play';
            this.playerData = data;
            this.playList = null;
            this.statUrl = null;
            this.callback = null;
        }

        Player.prototype.setPlayList = function(playlist) {
            playlist.map(function(data) {
                data.url = parseUrl(data.url).clearUrl + '&play';
            });
            this.playList = playlist;
        };

        Player.prototype.setStatUrl = function(url) {
            this.statUrl = url;
        };

        Player.prototype.setCallback = function(callback) {
            this.callback = callback;
        };

        Player.prototype.play = function() {
            lampaPlay(this.playerData);
            if (this.playList) lampaPlaylist(this.playList);
            if (this.callback) lampaCallback(this.callback);
            if (this.statUrl) lampaStat(this.statUrl);
            player = null;
        };

        return Player;
    })();

    // Переопределение функций плеера
    Lampa.Player.playlist = function(playlist) {
        if (player) {
            player.setPlayList(playlist);
        } else {
            lampaPlaylist(playlist);
        }
    };

    Lampa.Player.stat = function(url) {
        if (player) {
            player.setStatUrl(url);
        } else {
            lampaStat(url);
        }
    };

    Lampa.Player.callback = function(callback) {
        if (player) {
            player.setCallback(callback);
        } else {
            lampaCallback(callback);
        }
    };

    Lampa.Player.play = function(data) {
        var shouldPreload = Lampa.Storage.field('torrserver_preload') &&
                           data.url &&
                           tsIP() &&
                           data.url.indexOf(tsIP()) > -1 &&
                           (Lampa.Storage.field('player_timecode') === 'again' ||
                            !data.timeline || 
                            !data.timeline.time ||
                            parseFloat('0' + data.timeline.time) < 60 ||
                            true); // Кнопка запуска плеера всегда доступна

        if (shouldPreload) {
            preload(data);
        } else {
            lampaPlay(data);
        }
    };

    // Вспомогательные функции
    function params(obj) {
        var pairs = [];
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                pairs.push(prop + (obj[prop] ? '=' + obj[prop] : ''));
            }
        }
        return pairs.join('&');
    }

    function parseUrl(url) {
        var match, base_url, stream, args, arg = {};
        var regex = /^(https?:\/\/.+?)(\/stream\/[^?]+)\?(.+)$/i;
        
        if ((match = url.match(regex))) {
            base_url = match[1];
            stream = match[2];
            args = match[3];
            
            args.split('&').forEach(function(v) {
                var p = v.split('=');
                arg[p[0]] = p[1] || null;
            });
            
            // Удаление служебных параметров
            delete arg['play'];
            delete arg['preload'];
            delete arg['stat'];
        }
        
        args = params(arg);
        
        return {
            clearUrl: base_url + stream + '?' + args,
            base_url: base_url,
            stream: stream,
            args: '?' + args,
            arg: arg
        };
    }

    // Основная функция предзагрузки
    function preload(data) {
        var u = parseUrl(data.url);
        if (!u.arg.link) return lampaPlay(data);
        
        player = new Player(data);
        var controller = Lampa.Controller.enabled().name;
        var network = new Lampa.Reguest();
        
        // Создание HTML для модального окна
        var modalHtml = $('<div>' +
            '<div class="broadcast__text" style="text-align: left">' +
                '<span class="js-peer"> </span><br>' +
                '<span class="js-buff"> </span><br>' +
                '<span class="js-speed"> </span>' +
            '</div>' +
            '<div class="broadcast__scan"><div></div></div>' +
            '</div>');
        
        var peer = modalHtml.find('.js-peer');
        var buff = modalHtml.find('.js-buff');
        var speed = modalHtml.find('.js-speed');
        
        // Создание модального окна
        var modal = new Modal({
            title: Lampa.Lang.translate('loading'),
            html: modalHtml,
            onBack: cancel,
            buttons: [
                {
                    name: Lampa.Lang.translate('cancel'),
                    onSelect: cancel
                },
                {
                    name: Lampa.Lang.translate('player_lauch'),
                    onSelect: play
                }
            ]
        });
        
        modal.open();
        
        // Функции управления
        function destroy() {
            network.clear();
            modal.close();
            Lampa.Controller.toggle(controller);
        }
        
        function cancel() {
            if (player) {
                destroy();
                if (player.callback) player.callback();
                player = null;
            }
        }
        
        function play() {
            if (player) {
                destroy();
                player.play();
            }
        }
        
        // Настройка сети и предзагрузка
        network.timeout(1800 * 1000); // 30 минут на предзагрузку
        network.silent(u.clearUrl + '&preload', play, play);
        network.timeout(2000);
        
        // Функция обновления статистики
        var stat = function(data) {
            if (!player) return;
            
            if (data && data.Torrent) {
                var t = data.Torrent;
                var preloadPercent = Math.floor((t.preloaded_bytes || 0) * 100 / (t.preload_size || 1));
                
                peer.html(Lampa.Lang.translate('ts_preload_peers') + ': ' + 
                         (t.active_peers || 0) + ' / ' + 
                         (t.pending_peers || 0) + ' (' + 
                         (t.total_peers || 0) + ') • ' + 
                         (t.connected_seeders || 0) + ' - ' + 
                         Lampa.Lang.translate('ts_preload_seeds'));
                
                buff.html(Lampa.Lang.translate('ts_preload_preload') + ': ' + 
                         Lampa.Utils.bytesToSize(t.preloaded_bytes || 0) + ' / ' + 
                         Lampa.Utils.bytesToSize(t.preload_size || 0) + ' (' + 
                         preloadPercent + '%)');
                
                speed.text(Lampa.Lang.translate('ts_preload_speed') + ': ' + 
                          Lampa.Utils.bytesToSize((t.download_speed || 0) * 8, true));
            }
            
            // Обновление статистики
            var statData = JSON.stringify({ action: 'get', hash: u.arg.link });
            network.silent(u.base_url + '/cache', stat, stat, statData);
        };
        
        // Инициализация статистики нулевыми значениями
        stat({
            Torrent: {
                active_peers: 0,
                pending_peers: 0,
                total_peers: 0,
                connected_seeders: 0,
                preloaded_bytes: 0,
                preload_size: 0,
                download_speed: 0
            }
        });
    }
})(jQuery, Lampa);
