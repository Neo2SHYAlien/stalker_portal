
        var channelList = [
        {% if app['allChannels'] %}
            {% set i_last = app['allChannels']|last %}
            {% for item in app.allChannels %}
                {% if loop|last %}
            {'logo': '{{item.logo}}', 'link': 'tv-channels/edit-channel?id={{item.id}}', 'name': '{{item.name}}', 'id': '{{item.id}}', 'number': '{{item.number}}', 'locked': '{{item.locked}}', 'old_number': '{{item.number}}', 'empty': '{{item.empty}}'}
                {% else %}
            {'logo': '{{item.logo}}', 'link': 'tv-channels/edit-channel?id={{item.id}}', 'name': '{{item.name}}', 'id': '{{item.id}}', 'number': '{{item.number}}', 'locked': '{{item.locked}}', 'old_number': '{{item.number}}', 'empty': '{{item.empty}}'},
                {% endif %}
            {% endfor %}
        {% endif%}
        ];

        function yelp() {
            $(document).ready(function () {

                //
                // Swap 2 elements on page. Used by WinMove function
                //
                jQuery.fn.swap = function (b, parentArray) {
                    b = jQuery(b)[0];
                    var a = this[0];
                    var a_num = $(a).find('span.curr_num').data('number');
                    var b_num = $(b).find('span.curr_num').data('number');
                    var remove = $(b).children('div').hasClass('empty');

                    b.parentNode.insertBefore(a, b);

                    if (typeof(parentArray) == 'object' && parentArray.length !=0) {
                        a_num = parseInt(a_num, 10) - 1;
                        b_num = parseInt(b_num, 10) - 1;

                        var direction = a_num < b_num ? 1: -1;
                        var next_num = a_num + direction;

                        while( Math.abs(b_num - next_num + direction) > 0) {
                            if ( typeof(parentArray[next_num]) != 'undefined' && typeof(parentArray[next_num].locked) != 'undefined' &&  !parentArray[next_num].locked) {
                                var temp_a_number = parentArray[a_num].number;
                                var temp_next_number = parentArray[next_num].number;

                                var temp_a = parentArray[a_num];
                                parentArray[a_num] = parentArray[next_num];
                                parentArray[next_num] = temp_a;

                                parentArray[a_num].number = temp_a_number;
                                parentArray[next_num].number = temp_next_number;

                                a_num = next_num;
                            }
                            next_num += direction;
                        }
                    }
                    return this;
                };

                channelListRender('#channelListContainer');

                $(document).on('click', '#iptv_list_move_send', function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    var dataForSend = new Array();

                    $.each(channelList, function(){
                        if (this.number != this.old_number && !this.empty) {
                            dataForSend.push({'id': this.id, 'number': this.number, 'old_number': this.old_number});
                        }
                        this.old_number = this.number;
                    });

                    if (dataForSend.length) {
                        showModalBox();
                        ajaxPostSend('{{ app['controller_alias'] }}/move-apply', {data: dataForSend});
                    }
                    $("#modalbox").data('complete', 1);
                    return false;
                });
                $(document).on('keyup', "#searc_and_backlight input[type='text']", function(e){
                    if (typeof(e) != 'undefined' && typeof(e.type) != 'undefined' && e.type=='keyup' && e.keyCode == 13) {
                        setBackLightFocus();
                        return true;
                    }
                    $("#channelListContainer .box").removeClass('shining');
                    var search = $(this).val();
                    if ($.trim(search) != ''){
                        $.each(['\\', '[',']','<','>','=','+','*','?','|','(',')','$','.','&', '{', '}'], function(i, val){
                            search = search.replace(val, "\\" + val);
                        });
                        
                        $("#channelListContainer .box").each(function(){
                            var searchRegExp = new RegExp(search, "gi");
                            if (searchRegExp.test($(this).find('.curr_num').text()) || searchRegExp.test($(this).find('.channel').text())) {
                                $(this).find('.channel').addClass('backlight');
                            } else {
                                $(this).find('.channel').removeClass('backlight');
                            }
                        })
                    } else {
                        $("#channelListContainer .backlight").removeClass('backlight');
                    }
                });
                
                $(document).on('click', "#searc_and_backlight button", function(e){
                    e.stopPropagation();
                    e.preventDefault();
                    setBackLightFocus();
                    return false;
                });
                
                function setBackLightFocus(){
                    var first = $("#channelListContainer .box .backlight").get(0);
                    if (!$(first).closest('.box').hasClass('shining')) {
                        $(first).closest('.box').addClass('shining')
                            $('#channelListContainer').scrollTo($(first).closest('.box'), 'slow');
                        return;
                    }
                    $("#channelListContainer .box .backlight").each(function(index){
                        var parent = $(this).closest('.box');                       
                        if (index == 0 || parent.hasClass('shining')) {
                            return true;
                        } else if (index == $("#channelListContainer .box .backlight").length - 1){
                            $("#channelListContainer .box").removeClass('shining');
                            $('#channelListContainer').scrollTo(parent, 'slow');
                            return false;
                        }
                        
                        $('#channelListContainer').scrollTo(parent, 'slow');
                        parent.addClass('shining');
                        return false;
                    });
                }

                $('#channelListContainer').on('click', '.box-icons a', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var childI = $(this).children('i');
                    var childID = parseInt($(this).closest('.box').find('span.curr_num').data('number'), 10) - 1;
                    if (childI.hasClass('fa-lock')) {
                        childI.removeClass('fa-lock').addClass('fa-unlock');
                        $(this).closest("div.box").removeClass('no-drop').draggable("enable").droppable("enable");
                        channelList[childID].locked = false;
                    } else {
                        childI.removeClass('fa-unlock').addClass('fa-lock');
                        $(this).closest("div.box").addClass('no-drop').draggable("disable").droppable("disable");
                        channelList[childID].locked = true;
                    }
                    ajaxPostSend('{{ app['controller_alias'] }}/toogle-lock-channel', {data:{1: {id: childI.data('id'), locked: channelList[childID].locked} } });
                    $("#modalbox").data('complete', 1);
                    return false;
                });
                
            });
        }

        document.addEventListener( "DOMContentLoaded", yelp, false );

        function channelListRender(container){

            var _container = $(container);
            _container.empty();
            var maxBlockHeight = $(window).height()- _container.offset().top - 50;
            _container.height(maxBlockHeight);
            maxBlockHeight -= $(document).height() - $(window).height();
            _container.height(maxBlockHeight +10);
            var maxBlockWidth = $(window).width()- _container.offset().left - 50;
            _container.width(maxBlockWidth+10);
            var maxItemOnBlock = Math.floor(maxBlockHeight/50);
            var currentCount = 0;
            for (var i= 0; i< channelList.length; ) {
                var currentBlock = $("<div/>", {'class': 'no-padding'}).appendTo(_container);
                var currentItemsBlock = $("<div/>", {'class': 'no-padding'}).appendTo(currentBlock)
                for ( var j = currentCount; j < (currentCount + maxItemOnBlock) && j < channelList.length; j++) {
                    if (typeof(channelList[j]) == 'undefined') {
                        continue;
                    }
                    currentItemsBlock.append(getChannelListItem(j+1, channelList[j]));
                    i++;
                }
                currentBlock.prepend('<div class=" counter"><span>' + (currentCount + 1) + '-'+ (j) + '</span></div>');
                currentCount = j;
                currentBlock.css('top', 0);
                currentBlock.css('left', (Math.ceil(currentCount/maxItemOnBlock) - 1)*250);
                if (j >= channelList.length) {
                    break;
                }
            }

            WinMove();
        }

        function WinMove() {
            var parentArray = (typeof(channelList) != 'undefined') ? channelList : {};
            $("div.box").draggable({
                revert: true,
                zIndex: 2000,
                cursor: "crosshair",
                handle: '.box-name',
                class: 'highlight',
                opacity: 0.8
            })
                    .droppable({
                        tolerance: 'pointer',
//                activeClass: "ui-state-hover",
                        hoverClass: "highlight",//"ui-state-active",
                        drop: function (event, ui) {
                            var draggable = ui.draggable;
                            var droppable = $(this);
                            var dragPos = draggable.position();
                            var dropPos = droppable.position();
                            draggable.swap(droppable, parentArray);
                            setTimeout(function () {
                                var dropmap = droppable.find('[id^=map-]');
                                var dragmap = draggable.find('[id^=map-]');
                                if (dragmap.length > 0 || dropmap.length > 0) {
                                    dragmap.resize();
                                    dropmap.resize();
                                }
                                else {
                                    draggable.resize();
                                    droppable.resize();
                                }

                            }, 50);
                            setTimeout(function () {

                                draggable.find('[id^=map-]').resize();
                                droppable.find('[id^=map-]').resize();
                            }, 250);
                            if ($("#channelListContainer").length > 0) {
                                setTimeout(function () {
                                    channelListRender('#channelListContainer');
                                }, 300);
                            }
                        }
                    });
            $('div.box.no-drop').draggable( "disable" ).droppable( "disable" );
        }

        function getChannelListItem(num, item){
            var return_val = '<div class="box '+(item.locked? 'no-drop': '')+'"  style="position:relative; z-index:30;">\n\
                <div class="box-header '+ (item.empty == '1'? 'empty': '') + '"  style="position:relative; z-index:30;">\n\
                    <div class="box-name col-sm-11"  style="position:relative; z-index:30;">\n\
                        <span class="curr_num col-xs-1 col-sm-1 no-padding" data-number="'+num+'">'+item.number+'</span>\n\
                        <div class="channel col-xs-10 col-sm-10 no-padding">\n\
                            <span class="no-padding">\n\
                              <!----  <img class="img-rounded" src="'+item.logo+'" alt="">--->\n\
                            </span>\n\
                            <a style="position:relative; z-index:300;" href="'+item.link+'" class="no-padding">'+item.name+'</a>';
            if (item.empty != '1') {
                return_val +='<div class="box-icons col-sm-1 no-padding"><a style="position:relative; z-index:300;" class="lock-link">\n\
                        <i data-id="' + item.id + '" class="fa fa-'+(!item.locked? 'un': '')+'lock"></i>\n\
                        </a></div>';
            }
            return_val +='    </div>\n\
                    </div>';


            return_val +='  <div class="no-move"></div>\n\
                </div>\n\
            </div>';
            return return_val;
        }


        function closeModalBox(){
            $.noty.closeAll();
        }
        
        function showModalBox(){
            notty('<span>{{ 'Request is being processed'|trans }}...</span>','notification');
        }
        
        var manageChannel = function (obj) {
            notty('<span>{{ 'Done'|trans }}!</span>','success');
        };
        
        var manageChannelError = function(data){
            if (typeof(data.nothing_to_do) == 'undefined' || !data.nothing_to_do) {
                notty('<span>{{ 'Error'|trans }}! ' + (data.error ? data.error : '') + '</span>', 'error');
            }
        };
        
        var checkChanges = function(){
            var dataForSend = new Array();
                
            $.each(channelList, function(){
                if (this.number != this.old_number) {
                    dataForSend.push({'id': this.id, 'number': this.number, 'old_number': this.old_number})
                }
            });
            
            return dataForSend.length > 0;
        };
        
        window.onunload = function(){
            if (checkChanges()) {
                return "{{ 'You have unsaved data. Really want to go?'|trans }}";
            }
        }; 
            
        window.onbeforeunload = function(){
            if (checkChanges()) {
                return "{{ 'You have unsaved data. Really want to go?'|trans }}";
            }
        };
