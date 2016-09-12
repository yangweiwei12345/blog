define(function (require, exports, module) {
    var $ = require('jquery'),
        SortViewBase = require('mod/listView/base/sortViewBase'),
        Class = require('mod/class');

    var DEFAULTS = $.extend({}, SortViewBase.DEFAULTS, {
            sortItemSelector: '.sort_item',
            sortAscClass: 'sort_asc',
            sortDescClass: 'sort_desc'
        }),
        $document = $(document);

    function preventSelectStart(type) {
        $document.on('selectstart' + type, function (e) {
            e.preventDefault();
        });
    }

    function restoreSelectStart(type) {
        $document.off('selectstart' + type);
    }

    var SimpleSortView = Class({
        instanceMembers: {
            initMiddle: function () {
                var opts = this.options;

                //用来管理多列排序
                this.multiple = false;
                this.$sort_items = this.$element.find(opts.sortItemSelector);

                this.namespace_rnd = Math.round(Math.random() * 10000);
            },
            beforeBindEvents: function(){
                var that = this,
                    rnd = this.namespace_rnd,
                    sf = this.sortFields;

                sf.on('sortStart' + sf.namespace, function(){
                    preventSelectStart(that.namespace + '.' + rnd);
                });

                sf.on('sortEnd' + sf.namespace, function(){
                    restoreSelectStart(that.namespace + '.' + rnd);
                });
            },
            bindEvents: function () {
                //子类在实现bindEvent时，必须先调用父类的同名方法
                this.base();

                var that = this,
                    opts = this.options;

                var rnd = this.namespace_rnd;

                //在事件后面增加随机数的目的是防止$document的事件触发冲突
                //结合namespace跟rnd，就相当于给document的事件添加了两个命名空间
                //这样即使同一个页面中有多个SimpleSortView的实例，互相之间也不会有事件冲突的影响
                $document.on('keydown' + this.namespace + '.' + rnd, function (e) {
                    if(that.disabled) return;

                    if (e.which == 16) {
                        //shift键按下的时候，表示要进行多列排序
                        that.multiple = true;
                    }
                }).on('keyup' + this.namespace + '.' + rnd, function (e) {
                    if(that.disabled) return;

                    if (e.which == 16 && that.multiple) {
                        that.multiple = false;
                        //shift键抬起的时候，结束多列排序
                        that.sortFields.endSort();
                    }
                });

                this.$element.on('click', opts.sortItemSelector, function () {
                    if(that.disabled) return;

                    that.sortFields.changeState($(this).data('field'), that.multiple);
                });
            },
            render: function () {
                var that = this,
                    opts = this.options;

                this.sortFields.getConfig().forEach(function (fieldDef) {
                    var $target = that.$sort_items.filter('[data-field="' + fieldDef.field + '"]');

                    $target.removeClass([
                        opts.sortAscClass,
                        opts.sortDescClass
                    ].join(' '));

                    if (fieldDef.value !== 'no') {
                        $target.addClass(
                            fieldDef.value == 'asc' ? opts.sortAscClass : opts.sortDescClass
                        );
                    }
                });
            }
        },
        extend: SortViewBase,
        staticMembers: {
            DEFAULTS: DEFAULTS,
            dataAttr: 'simpleSortView'
        }
    });

    return SimpleSortView;
});